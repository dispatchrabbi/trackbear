import { traced } from '../../tracer.ts';

import dbClient from '../../db.ts';
import type { Create, Update } from '../types.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import { LEADERBOARD_STATE, LEADERBOARD_PARTICIPANT_STATE } from './consts.ts';
import type { LeaderboardSummary, Leaderboard, Participant, Participation, Member, LeaderboardParticipant } from './types.ts';
import { getTalliesForParticipants } from './helpers.ts';
import type { User } from '../user/user-model.ts';
import { USER_STATE } from '../user/consts.ts';
import { makeIncludeWorkAndTagIds, included2ids, makeSetWorksAndTagsIncluded, type WorksAndTagsIncluded, makeConnectWorksAndTagsIncluded } from '../helpers.ts';

import { omit, pick } from 'server/lib/obj.ts';

// used for db2participation and db2member
import { BoardParticipant as PrismaBoardParticipant, User as PrismaUser } from '@prisma/client';
type DbParticipation = PrismaBoardParticipant & WorksAndTagsIncluded;
type DbMember = PrismaBoardParticipant & { user: PrismaUser };

type GetLeaderboardOptions = {
  memberUserId?: number;
  ownerUserId?: number;
  includePublicLeaderboards?: boolean;
};

type OptionalLeaderboardFields = 'description' | 'isJoinable' | 'isPublic';
type OmitFromCreateLeaderboardFields = 'starred';
export type CreateLeaderboardData = Create<Leaderboard, OptionalLeaderboardFields, OmitFromCreateLeaderboardFields>;
export type UpdateLeaderboardData = Update<Leaderboard, OmitFromCreateLeaderboardFields>;

type OptionalMemberFields = 'isParticipant' | 'isOwner';
type OmitFromCreateMemberFields = 'userId' | 'boardId';
export type CreateMemberData = Create<LeaderboardParticipant, OptionalMemberFields, OmitFromCreateMemberFields>;
export type UpdateMemberData = Update<LeaderboardParticipant, OmitFromCreateMemberFields>;

export type CreateParticipationData = Create<Participation>;
export type UpdateParticipationData = Update<Participation>;

export class LeaderboardModel {
  // Leaderboard methods

  @traced
  static async list(participantUserId: number): Promise<LeaderboardSummary[]> {
    const leaderboardsWithMembers = await dbClient.board.findMany({
      where: {
        state: LEADERBOARD_STATE.ACTIVE,
        participants: {
          some: {
            userId: participantUserId,
            state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
          },
        },
      },
      include: {
        participants: {
          where: {
            state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
            user: { state: USER_STATE.ACTIVE },
          },
          include: {
            user: true,
          },
        },
      },
    });

    const summaries = leaderboardsWithMembers.map(board => ({
      ...pick(board, [
        'id', 'uuid', 'state', 'ownerId', 'createdAt', 'updatedAt',
        'title', 'description',
        'measures', 'startDate', 'endDate', 'goal',
        'individualGoalMode', 'fundraiserMode',
        'isJoinable', 'isPublic',
      ]),
      // use the starred property from the participant, not the leaderboard
      starred: board.participants.find(p => p.userId === participantUserId).starred,
      members: board.participants.map(participant => ({
        id: participant.id,
        isParticipant: participant.isParticipant,
        userUuid: participant.user.uuid,
        // TODO: this will change when we have per-board display names
        displayName: participant.user.displayName,
        avatar: participant.user.avatar,
      })),
    })) as LeaderboardSummary[];

    return summaries;
  }

  @traced
  static async get(id: number): Promise<Leaderboard> {
    const leaderboard = await dbClient.board.findUnique({
      where: {
        id: id,
        state: LEADERBOARD_STATE.ACTIVE,
      },
    }) as Leaderboard;

    return leaderboard;
  }

  @traced
  static async getByUuid(uuid: string, options: GetLeaderboardOptions = {}): Promise<Leaderboard> {
    const extraWhereClauses = [];

    if(options.memberUserId) {
      extraWhereClauses.push({
        participants: {
          some: {
            userId: options.memberUserId,
            state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
          },
        },
      });
    }

    if(options.ownerUserId) {
      extraWhereClauses.push({
        participants: {
          some: {
            userId: options.memberUserId,
            state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
            isOwner: true,
          },
        },
      });
    }

    if(options.includePublicLeaderboards) {
      extraWhereClauses.push({
        isPublic: true,
      });
    }

    const leaderboard = await dbClient.board.findUnique({
      where: {
        uuid: uuid,
        state: LEADERBOARD_STATE.ACTIVE,
        OR: extraWhereClauses,
      },
    }) as Leaderboard;

    return leaderboard;
  }

  @traced
  static async getByJoinCode(joinCode: string): Promise<Leaderboard> {
    const leaderboard = await dbClient.board.findFirst({
      where: {
        // TODO: this will change when we implement rolling join codes
        uuid: joinCode,
        state: LEADERBOARD_STATE.ACTIVE,
        isJoinable: true,
      },
    }) as Leaderboard;

    return leaderboard;
  }

  @traced
  static async create(data: CreateLeaderboardData, ownerId: number, reqCtx: RequestContext): Promise<Leaderboard> {
    const dataWithDefaults: Required<CreateLeaderboardData> = Object.assign({
      description: '',
      isJoinable: false,
      isPublic: false,
    }, data);

    const normalizedData = this.normalizeBoardData(dataWithDefaults);
    const memberData: CreateMemberData & { userId: number; goal: null } = {
      userId: ownerId,
      isParticipant: false,
      isOwner: true,
      starred: false,
      goal: null,
    };

    const createdWithParticipants = await dbClient.board.create({
      data: {
        state: LEADERBOARD_STATE.ACTIVE,
        ownerId: ownerId,
        starred: false,

        ...normalizedData,

        participants: {
          create: {
            state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
            ...memberData,
          },
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    const created = omit(createdWithParticipants, ['participants']) as Leaderboard;
    const createdParticipant = this.db2member(createdWithParticipants.participants[0]);

    const leaderboardChangeRecord = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_CREATE,
      reqCtx.userId, created.id, null,
      leaderboardChangeRecord, reqCtx.sessionId,
    );

    const leaderboardMemberChangeRecord = buildChangeRecord({}, createdParticipant);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_CREATE,
      reqCtx.userId, createdParticipant.id, null,
      leaderboardMemberChangeRecord, reqCtx.sessionId,
    );
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_JOIN,
      reqCtx.userId, ownerId, created.id,
      { memberId: createdParticipant.id }, reqCtx.sessionId,
    );

    return created;
  }

  @traced
  static async update(leaderboard: Leaderboard, data: UpdateLeaderboardData, reqCtx: RequestContext): Promise<Leaderboard> {
    const normalizedData = this.normalizeBoardData(data);

    const updated = await dbClient.board.update({
      where: {
        id: leaderboard.id,
        state: LEADERBOARD_STATE.ACTIVE,
      },
      data: normalizedData,
    }) as Leaderboard;

    const changes = buildChangeRecord(leaderboard, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_UPDATE,
      reqCtx.userId, updated.id, null,
      changes, reqCtx.sessionId,
    );

    return updated;
  }

  @traced
  static async delete(leaderboard: Leaderboard, reqCtx: RequestContext): Promise<Leaderboard> {
    const deleted = await dbClient.board.update({
      where: {
        id: leaderboard.id,
        state: LEADERBOARD_STATE.ACTIVE,
      },
      data: {
        state: LEADERBOARD_STATE.DELETED,
      },
    }) as Leaderboard;

    const changes = buildChangeRecord(leaderboard, deleted);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_DELETE,
      reqCtx.userId, deleted.id, null,
      changes, reqCtx.sessionId,
    );

    return deleted;
  }

  private static normalizeBoardData<T extends Required<CreateLeaderboardData> | UpdateLeaderboardData>(data: T): T {
    // if the board is in individual goal mode, it can have no goals or measures, and fundraiser mode is impossible
    if(data.individualGoalMode) {
      data.goal = {};
      data.measures = [];
      data.fundraiserMode = false;
    }

    return data;
  }

  // Member methods

  @traced
  static async listMembers(leaderboard: Leaderboard): Promise<Member[]> {
    const dbMembers = await dbClient.boardParticipant.findMany({
      where: {
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        boardId: leaderboard.id,
        board: { state: LEADERBOARD_STATE.ACTIVE },
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
      },
    });

    const members = dbMembers.map(dbMember => this.db2member(dbMember));

    return members;
  };

  @traced
  static async getMember(leaderboard: Leaderboard, id: number): Promise<Member> {
    const dbMember = await dbClient.boardParticipant.findUnique({
      where: {
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        id: id,
        boardId: leaderboard.id,
        board: { state: LEADERBOARD_STATE.ACTIVE },
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
      },
    });

    const member = this.db2member(dbMember);
    return member;
  };

  @traced
  static async getMemberByUserId(leaderboard: Leaderboard, userId: number): Promise<Member> {
    const dbMember = await dbClient.boardParticipant.findUnique({
      where: {
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        userId_boardId: {
          boardId: leaderboard.id,
          userId: userId,
        },
        board: { state: LEADERBOARD_STATE.ACTIVE },
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
      },
    });

    const member = this.db2member(dbMember);
    return member;
  };

  @traced
  static async isUserOwner(leaderboard: Leaderboard, userId: number): Promise<boolean> {
    const dbMember = await dbClient.boardParticipant.findUnique({
      where: {
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        userId_boardId: {
          boardId: leaderboard.id,
          userId: userId,
        },
        board: { state: LEADERBOARD_STATE.ACTIVE },
        user: { state: USER_STATE.ACTIVE },
        isOwner: true,
      },
    });

    return dbMember !== null;
  }

  @traced
  static async createMember(leaderboard: Leaderboard, user: User, data: CreateMemberData, reqCtx: RequestContext): Promise<Member> {
    const dataWithDefaults = {
      starred: false,
      isParticipant: true,
      isOwner: false,
      ...data,
      goal: null,
    };

    const dbCreated = await dbClient.boardParticipant.create({
      data: {
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        boardId: leaderboard.id,
        userId: user.id,

        ...dataWithDefaults,
      },
      include: {
        user: true,
      },
    });

    const created = this.db2member(dbCreated);

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_CREATE,
      reqCtx.userId, created.id, leaderboard.id,
      changes, reqCtx.sessionId,
    );
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_JOIN,
      reqCtx.userId, user.id, leaderboard.id,
      { memberId: created.id }, reqCtx.sessionId,
    );

    return created;
  }

  @traced
  static async updateMember(member: Member, data: UpdateMemberData, reqCtx: RequestContext): Promise<Member> {
    const dbUpdated = await dbClient.boardParticipant.update({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
      data: data,
      include: {
        user: true,
      },
    });

    const updated = this.db2member(dbUpdated);

    const changes = buildChangeRecord(member, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_UPDATE,
      reqCtx.userId, updated.id, member.boardId,
      changes, reqCtx.sessionId,
    );

    return updated;
  }

  @traced
  static async removeMember(member: Member, reqCtx: RequestContext): Promise<null> {
    if(member.isOwner) {
      const leaderboard = await this.get(member.boardId);
      const members = await this.listMembers(leaderboard);
      const owners = members.filter(member => member.isOwner);

      if(owners.length === 1 && owners[0].id === member.id) {
        throw new Error('Cannot remove member; they are the last owner of this leaderboard');
      }
    }

    const removed = await dbClient.boardParticipant.delete({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
    });

    const changes = buildChangeRecord(member, removed);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_DELETE,
      reqCtx.userId, removed.id, member.boardId,
      changes, reqCtx.sessionId,
    );
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_LEAVE,
      reqCtx.userId, member.userId, member.boardId,
      { memberId: removed.id }, reqCtx.sessionId,
    );

    return null;
  }

  private static db2member(record: DbMember): Member {
    if(record === null) {
      return null;
    }

    return {
      displayName: record.user.displayName,
      avatar: record.user.avatar,
      ...omit(record, ['user']) as LeaderboardParticipant,
    } as Member;
  }

  // Participation methods

  @traced
  static async listParticipants(leaderboard: Leaderboard): Promise<Participant[]> {
    const rawParticipants = await dbClient.boardParticipant.findMany({
      where: {
        boardId: leaderboard.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        isParticipant: true,
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
        worksIncluded: true,
        tagsIncluded: true,
      },
    });

    const tallies = await getTalliesForParticipants(leaderboard, rawParticipants);

    const participants = rawParticipants.map(participant => ({
      ...pick(participant, ['id', 'uuid', 'goal']),
      avatar: participant.user.avatar,
      displayName: participant.user.displayName,
      tallies: tallies.filter(tally => tally.ownerId === participant.userId).map(tally => pick(tally, ['uuid', 'date', 'measure', 'count'])),
    })) as Participant[];

    return participants;
  }

  @traced
  static async getMemberParticipation(leaderboardId: number, userId: number): Promise<Participation> {
    const found = await dbClient.boardParticipant.findUnique({
      where: {
        userId_boardId: {
          userId: userId,
          boardId: leaderboardId,
        },
        isParticipant: true,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        board: { state: LEADERBOARD_STATE.ACTIVE },
        user: { state: USER_STATE.ACTIVE },
      },
      include: makeIncludeWorkAndTagIds(userId),
    });

    const participation = this.db2participation(found);

    return participation;
  }

  @traced
  static async addMemberParticipation(leaderboardId: number, userId: number, data: CreateParticipationData, reqCtx: RequestContext): Promise<Participation> {
    const dbCreated = await dbClient.boardParticipant.create({
      data: {
        boardId: leaderboardId,
        userId: userId,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        starred: false,
        isParticipant: true,
        isOwner: false,
        ...omit(data, ['workIds', 'tagIds']),
        ...makeConnectWorksAndTagsIncluded(data, userId),
      },
      include: makeIncludeWorkAndTagIds(userId),
    });

    const created = this.db2participation(dbCreated);

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_CREATE,
      reqCtx.userId, created.id, leaderboardId,
      changes, reqCtx.sessionId,
    );

    return created;
  }

  @traced
  static async updateMemberParticipation(member: Member, data: UpdateParticipationData, reqCtx: RequestContext): Promise<Participation> {
    // grab the existing info before we make the change so we can do a change record. This one is weird because we
    // don't send works and tags with Member (as we do with, e.g., Goal) so we have to ask for them specifically
    // in order to record the actual change.
    const dbExisting = await dbClient.boardParticipant.findUnique({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
      include: makeIncludeWorkAndTagIds(member.id),
    });
    const existing = this.db2participation(dbExisting);

    const dbUpdated = await dbClient.boardParticipant.update({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
      data: {
        ...omit(data, ['workIds', 'tagIds']),
        // if this is an owner adding participation for the first time, set isParticipant for them
        isParticipant: true,
        ...makeSetWorksAndTagsIncluded(data, member.userId),
      },
      include: makeIncludeWorkAndTagIds(member.userId),
    });

    const updated = this.db2participation(dbUpdated);

    const changes = buildChangeRecord(existing, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_UPDATE,
      reqCtx.userId, updated.id, member.boardId,
      changes, reqCtx.sessionId,
    );

    return updated;
  }

  @traced
  static async removeMemberParticipation(member: Member, reqCtx: RequestContext): Promise<null> {
    if(!member.isOwner) {
      // removing your participation is the same as leaving the leaderboard
      await this.removeMember(member, reqCtx);
      return null;
    }

    // grab the existing info before we make the change so we can do a change record. This one is weird because we
    // don't send works and tags with Member (as we do with, e.g., Goal) so we have to ask for them specifically
    // in order to record the actual change.
    const dbExisting = await dbClient.boardParticipant.findUnique({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        isParticipant: true,
      },
      include: makeIncludeWorkAndTagIds(member.id),
    });
    const existing = this.db2participation(dbExisting);

    if(!existing) {
      return null;
    }

    // when removing an owner's participation, we zero out/reset their participation parameters. While it would be nice
    // to keep things around so they can easily be restored, it would mean that owners would have a different experience
    // than sole-participants and so would not be able to help guide or troubleshoot.
    const dbRemoved = await dbClient.boardParticipant.update({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
      data: {
        isParticipant: false,
        goal: null,
        ...makeSetWorksAndTagsIncluded({
          workIds: [],
          tagIds: [],
        }, member.userId),
      },
      include: makeIncludeWorkAndTagIds(member.id),
    });
    const updated = this.db2participation(dbRemoved);

    const changes = buildChangeRecord(existing, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_UPDATE,
      reqCtx.userId, member.id, member.boardId,
      changes, reqCtx.sessionId,
    );

    return null;
  }

  private static db2participation(record: DbParticipation): Participation {
    if(record === null) {
      return null;
    }

    return included2ids(pick(record, [
      'id', 'goal', 'worksIncluded', 'tagsIncluded',
    ])) as Participation;
  }

  // TODO: listBannedMembers(), banMember(), unbanMember()
}
