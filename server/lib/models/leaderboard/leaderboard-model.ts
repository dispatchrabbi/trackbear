import { traced } from '../../metrics/tracer.ts';

import { Prisma, BoardParticipant as PrismaBoardParticipant, User as PrismaUser } from 'generated/prisma/client';
import dbClient from '../../db.ts';
import type { Create, Update } from '../types.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import { LEADERBOARD_STATE, LEADERBOARD_PARTICIPANT_STATE } from './consts.ts';
import type { LeaderboardSummary, Leaderboard, LeaderboardMember, JustMember, Participant, Participation, ParticipantGoal, MemberBio, LeaderboardGoal, LeaderboardTally } from './types.ts';
import { getTalliesForParticipants } from './helpers.ts';
import type { User } from '../user/user-model.ts';
import { USER_STATE } from '../user/consts.ts';
import { makeIncludeWorkAndTagIds, included2ids, makeSetWorksAndTagsIncluded, type WorksAndTagsIncluded, makeConnectWorksAndTagsIncluded, supplyDefaults } from '../helpers.ts';

import { omit, pick } from 'server/lib/obj.ts';

// used for db2participation and db2member
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

type OptionalMemberFields = 'goal' | 'workIds' | 'tagIds' | 'isOwner';
// TODO: remove `displayName` from the omitted fields when per-board display names are implemented
type OmitFromCreateMemberFields = 'userId' | 'boardId' | 'avatar' | 'displayName';
export type CreateMemberData = Create<LeaderboardMember, OptionalMemberFields, OmitFromCreateMemberFields>;
export type UpdateMemberData = Update<LeaderboardMember, OmitFromCreateMemberFields>;

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

    const summaries = leaderboardsWithMembers.map((board): LeaderboardSummary => ({
      ...pick(board, [
        'id', 'uuid', 'state', 'ownerId', 'createdAt', 'updatedAt',
        'title', 'description',
        'measures', 'startDate', 'endDate',
        'individualGoalMode', 'fundraiserMode',
        'isJoinable', 'isPublic',
      ]),
      goal: board.goal as LeaderboardGoal,
      // use the starred property from the participant, not the leaderboard
      starred: board.participants.find(p => p.userId === participantUserId)?.starred ?? false,
      members: board.participants.map((participant): MemberBio => ({
        id: participant.id,
        isParticipant: participant.isParticipant,
        isOwner: participant.isOwner,
        userUuid: participant.user.uuid,
        // TODO: this will change when we have per-board display names
        displayName: participant.user.displayName,
        avatar: participant.user.avatar,
      })),
    }));

    return summaries;
  }

  @traced
  static async get(id: number): Promise<Leaderboard | null> {
    const leaderboard = await dbClient.board.findUnique({
      where: {
        id: id,
        state: LEADERBOARD_STATE.ACTIVE,
      },
    }) as Leaderboard;

    return leaderboard;
  }

  @traced
  static async getByUuid(uuid: string, options: GetLeaderboardOptions = {}): Promise<Leaderboard | null> {
    const extraWhereClauses: Prisma.BoardWhereInput[] = [];

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
        // Prisma doesn't treat an empty OR array as though there's nothing there, so we have to do it ourselves
        OR: extraWhereClauses.length > 0 ? extraWhereClauses : undefined,
      },
    }) as Leaderboard;

    return leaderboard;
  }

  @traced
  static async getByJoinCode(joinCode: string): Promise<Leaderboard | null> {
    const leaderboard = await dbClient.board.findFirst({
      where: {
        // TODO: this will change when we implement rolling join codes
        uuid: joinCode,
        state: LEADERBOARD_STATE.ACTIVE,
      },
    }) as Leaderboard;

    return leaderboard;
  }

  @traced
  static async create(data: CreateLeaderboardData, ownerId: number, reqCtx: RequestContext): Promise<Leaderboard> {
    const dataWithDefaults = supplyDefaults(data, {
      description: '',
      isJoinable: false,
      isPublic: false,
    });

    const normalizedData = this.normalizeBoardData(dataWithDefaults);
    const memberData: CreateMemberData & { userId: number } = {
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
        goal: normalizedData.goal ?? {},

        participants: {
          create: {
            state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
            ...memberData,
            goal: memberData.goal ?? Prisma.JsonNull,
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
    const createdParticipant = this.db2justmember(createdWithParticipants.participants[0]);

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
  static async listMembers(leaderboard: Leaderboard): Promise<JustMember[]> {
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

    const members = dbMembers.map(dbMember => this.db2justmember(dbMember));

    return members;
  };

  @traced
  static async getMember(leaderboard: Leaderboard, memberId: number): Promise<JustMember | null> {
    const dbMember = await dbClient.boardParticipant.findUnique({
      where: {
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        id: memberId,
        boardId: leaderboard.id,
        board: { state: LEADERBOARD_STATE.ACTIVE },
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
      },
    });

    if(!dbMember) {
      return null;
    }

    const member = this.db2justmember(dbMember);
    return member;
  };

  @traced
  static async getMemberByUserId(leaderboard: Leaderboard, userId: number): Promise<JustMember | null> {
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
    if(!dbMember) {
      return null;
    }

    const member = this.db2justmember(dbMember);
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
  static async createMember(leaderboard: Leaderboard, user: User, data: CreateMemberData, reqCtx: RequestContext): Promise<LeaderboardMember> {
    const dataWithDefaults = {
      ...data,
      starred: false,
      isParticipant: false,
      isOwner: false,
      goal: null,
      workIds: [],
      tagIds: [],
    };

    const dbCreated = await dbClient.boardParticipant.create({
      data: {
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        boardId: leaderboard.id,
        userId: user.id,

        ...omit(dataWithDefaults, ['workIds', 'tagIds']),
        ...makeConnectWorksAndTagsIncluded(dataWithDefaults, user.id),

        goal: dataWithDefaults.goal ?? Prisma.JsonNull,
      },
      include: {
        user: true,
        ...makeIncludeWorkAndTagIds(user.id),
      },
    });

    const created = this.db2member(dbCreated);

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_CREATE,
      reqCtx.userId, created.id, leaderboard.id,
      changes, reqCtx.sessionId,
    );

    return created;
  }

  @traced
  static async updateMember(member: JustMember, data: UpdateMemberData, reqCtx: RequestContext): Promise<LeaderboardMember> {
    const dbUpdated = await dbClient.boardParticipant.update({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
      data: {
        ...omit(data, ['workIds', 'tagIds']),
        ...makeSetWorksAndTagsIncluded(data, member.userId),
        goal: data.goal ?? Prisma.JsonNull,
      },
      include: {
        user: true,
        ...makeIncludeWorkAndTagIds(member.userId),
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
  static async removeMember(member: JustMember, reqCtx: RequestContext): Promise<LeaderboardMember> {
    if(member.isOwner) {
      const leaderboard = await this.get(member.boardId);
      if(!leaderboard) {
        throw new Error(`Cannot remove member from a non-existent board`);
      }

      const members = await this.listMembers(leaderboard);
      const owners = members.filter(member => member.isOwner);

      if(owners.length === 1 && owners[0].id === member.id) {
        throw new Error('Cannot remove member because they are the last owner of this leaderboard');
      }
    }

    const dbRemoved = await dbClient.boardParticipant.delete({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
      include: {
        user: true,
        ...makeIncludeWorkAndTagIds(member.userId),
      },
    });
    const removed = this.db2member(dbRemoved);

    const changes = buildChangeRecord(member, removed);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_DELETE,
      reqCtx.userId, removed.id, member.boardId,
      changes, reqCtx.sessionId,
    );

    return removed;
  }

  private static db2member(record: DbMember & WorksAndTagsIncluded): LeaderboardMember;
  private static db2member(record: null): null;
  private static db2member(record: (DbMember & WorksAndTagsIncluded) | null): LeaderboardMember | null {
    if(record === null) {
      return null;
    }

    const converted: LeaderboardMember = {
      ...omit(included2ids(record), ['user']) as LeaderboardMember,
      displayName: record.user.displayName,
      avatar: record.user.avatar,
    };

    return converted;
  }

  private static db2justmember(record: DbMember): JustMember;
  private static db2justmember(record: null): null;
  private static db2justmember(record: DbMember | null): JustMember | null {
    if(record === null) {
      return null;
    }

    const converted: JustMember = {
      ...omit(record, ['user']) as JustMember,
      displayName: record.user.displayName,
      avatar: record.user.avatar,
    };

    return converted;
  }

  // Participation methods

  @traced
  static async listParticipants(leaderboard: Leaderboard): Promise<Participant[]> {
    const rawParticipants = await dbClient.boardParticipant.findMany({
      where: {
        boardId: leaderboard.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        user: { state: USER_STATE.ACTIVE },
        isParticipant: true,
      },
      include: {
        user: true,
        worksIncluded: true,
        tagsIncluded: true,
      },
    });

    const tallies = await getTalliesForParticipants(leaderboard, rawParticipants);

    const participants = rawParticipants.map((participant): Participant => ({
      ...pick(participant, ['id', 'uuid']),
      goal: participant.goal as ParticipantGoal,
      avatar: participant.user.avatar,
      displayName: participant.user.displayName,
      tallies: tallies.filter(tally => tally.ownerId === participant.userId).map((tally): LeaderboardTally => pick(tally, ['uuid', 'date', 'measure', 'count'])),
    }));

    return participants;
  }

  @traced
  static async getMemberParticipation(leaderboardId: number, userId: number): Promise<Participation | null> {
    const found = await dbClient.boardParticipant.findUnique({
      where: {
        userId_boardId: {
          userId: userId,
          boardId: leaderboardId,
        },
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        board: { state: LEADERBOARD_STATE.ACTIVE },
        user: { state: USER_STATE.ACTIVE },
      },
      include: makeIncludeWorkAndTagIds(userId),
    });
    if(!found) {
      return null;
    }

    const participation = this.db2participation(found);
    return participation;
  }

  private static db2participation(record: DbParticipation): Participation;
  private static db2participation(record: null): null;
  private static db2participation(record: DbParticipation | null): Participation | null {
    if(record === null) {
      return null;
    }

    return included2ids(pick(record, [
      'id', 'isParticipant', 'goal', 'worksIncluded', 'tagsIncluded',
    ])) as Participation;
  }

  // TODO: listBannedMembers(), banMember(), unbanMember()
}
