import { traced } from '../../metrics/tracer.ts';

import { Prisma } from 'generated/prisma/client';
import dbClient from '../../db.ts';
import type { Create, Update } from '../types.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import { LEADERBOARD_STATE, LEADERBOARD_PARTICIPANT_STATE } from './consts.ts';
import type {
  LeaderboardSummary, Leaderboard,
  LeaderboardMember, Participant, ParticipantGoal,
  LeaderboardTally,
} from './types.ts';
import { db2justmember, db2summary, getTalliesForParticipants } from './helpers.ts';
import { USER_STATE } from '../user/consts.ts';
import { supplyDefaults } from '../helpers.ts';

import { omit, pick } from 'server/lib/obj.ts';

type GetLeaderboardOptions = {
  memberUserId?: number;
  ownerUserId?: number;
  includePublicLeaderboards?: boolean;
};

type OptionalLeaderboardFields = 'description' | 'isJoinable' | 'isPublic';
type OmitFromCreateLeaderboardFields = 'starred';
export type CreateLeaderboardData = Create<Leaderboard, OptionalLeaderboardFields, OmitFromCreateLeaderboardFields>;
export type UpdateLeaderboardData = Update<Leaderboard, OmitFromCreateLeaderboardFields>;

type OptionalMemberFields = 'goal' | 'workIds' | 'tagIds' | 'isOwner' | 'isParticipant' | 'displayName' | 'color';
type OmitFromCreateMemberFields = 'userId' | 'boardId' | 'avatar';
export type CreateMemberData = Create<LeaderboardMember, OptionalMemberFields, OmitFromCreateMemberFields>;
export type UpdateMemberData = Update<LeaderboardMember, OmitFromCreateMemberFields>;

export class LeaderboardModel {
  // Leaderboard methods

  @traced
  static async list(participantUserId: number): Promise<LeaderboardSummary[]> {
    const leaderboardsWithMembersAndTeams = await dbClient.board.findMany({
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
        teams: true,
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

    const summaries = leaderboardsWithMembersAndTeams.map(board => db2summary(board, participantUserId));

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
  static async getByUuid(uuid: string, options: GetLeaderboardOptions = {}): Promise<LeaderboardSummary | null> {
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
      include: {
        teams: true,
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

    if(!leaderboard) {
      return null;
    }

    const participantUserId = options.memberUserId ?? options.ownerUserId ?? undefined;
    const summary = db2summary(leaderboard, participantUserId);
    return summary;
  }

  @traced
  static async getByJoinCode(joinCode: string): Promise<LeaderboardSummary | null> {
    const leaderboard = await dbClient.board.findFirst({
      where: {
        // TODO: this will change when we implement rolling join codes
        uuid: joinCode,
        state: LEADERBOARD_STATE.ACTIVE,
      },
      include: {
        teams: true,
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

    if(!leaderboard) {
      return null;
    }

    const summary = db2summary(leaderboard);
    return summary;
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
      teamId: null,
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
    const createdParticipant = db2justmember(createdWithParticipants.participants[0]);

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

  @traced
  static async isUserOwner(leaderboard: Leaderboard, userId: number): Promise<boolean> {
    const dbMember = await dbClient.boardParticipant.findUnique({
      where: {
        userId_boardId: {
          boardId: leaderboard.id,
          userId: userId,
        },
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        user: { state: USER_STATE.ACTIVE },
        isOwner: true,
      },
    });

    return dbMember !== null;
  }

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
      displayName: participant.displayName || participant.user.displayName,
      color: participant.color,
      teamId: participant.teamId,
      tallies: tallies.filter(tally => tally.ownerId === participant.userId).map((tally): LeaderboardTally => pick(tally, ['uuid', 'date', 'measure', 'count'])),
    }));

    return participants;
  }
}
