import { traced } from '../../metrics/tracer.ts';

import dbClient from '../../db.ts';
import { Prisma } from 'generated/prisma/client';
import type { Create, Update } from '../types.ts';
import {
  makeIncludeWorkAndTagIds,
  makeSetWorksAndTagsIncluded,
  makeConnectWorksAndTagsIncluded,
  supplyDefaults,
} from '../helpers.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import { LEADERBOARD_PARTICIPANT_STATE } from './consts.ts';
import type { Leaderboard, LeaderboardMember, JustMember, Participation } from './types.ts';
import { db2justmember, db2member, db2participation } from './helpers.ts';
import { LeaderboardModel } from './leaderboard-model.ts';
import type { User } from '../user/user-model.ts';
import { USER_STATE } from '../user/consts.ts';

import { omit } from 'server/lib/obj.ts';

type OptionalMemberFields = 'goal' | 'workIds' | 'tagIds' | 'isOwner' | 'isParticipant' | 'displayName' | 'color' | 'teamId';
type OmitFromCreateMemberFields = 'userId' | 'boardId' | 'avatar';
export type CreateMemberData = Create<LeaderboardMember, OptionalMemberFields, OmitFromCreateMemberFields>;
export type UpdateMemberData = Update<LeaderboardMember, OmitFromCreateMemberFields>;

export class LeaderboardMemberModel {
  @traced
  static async list(leaderboard: Leaderboard): Promise<JustMember[]> {
    const dbMembers = await dbClient.boardParticipant.findMany({
      where: {
        boardId: leaderboard.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
      },
    });

    const members = dbMembers.map(dbMember => db2justmember(dbMember));

    return members;
  };

  @traced
  static async get(leaderboard: Leaderboard, memberId: number): Promise<JustMember | null> {
    const dbMember = await dbClient.boardParticipant.findUnique({
      where: {
        id: memberId,
        boardId: leaderboard.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
      },
    });

    if(!dbMember) {
      return null;
    }

    const member = db2justmember(dbMember);
    return member;
  };

  @traced
  static async getByUserId(leaderboard: Leaderboard, userId: number): Promise<JustMember | null> {
    const dbMember = await dbClient.boardParticipant.findUnique({
      where: {
        userId_boardId: {
          boardId: leaderboard.id,
          userId: userId,
        },
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        user: { state: USER_STATE.ACTIVE },
      },
      include: {
        user: true,
      },
    });

    if(!dbMember) {
      return null;
    }

    const member = db2justmember(dbMember);
    return member;
  };

  @traced
  static async create(leaderboard: Leaderboard, user: User, data: CreateMemberData, reqCtx: RequestContext): Promise<LeaderboardMember> {
    const dataWithDefaults = supplyDefaults(data, {
      starred: false,
      isParticipant: false,
      isOwner: false,
      displayName: '',
      color: '',
      goal: null,
      workIds: [],
      tagIds: [],
      teamId: null,
    });

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

    const created = db2member(dbCreated);

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_CREATE,
      reqCtx.userId, created.id, leaderboard.id,
      changes, reqCtx.sessionId,
    );

    return created;
  }

  @traced
  static async update(member: JustMember, data: UpdateMemberData, reqCtx: RequestContext): Promise<LeaderboardMember> {
    const dbUpdated = await dbClient.boardParticipant.update({
      where: {
        id: member.id,
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
      },
      data: {
        ...omit(data, ['workIds', 'tagIds']),
        ...makeSetWorksAndTagsIncluded(data, member.userId),
        goal: data.goal === null ? Prisma.JsonNull : data.goal,
      },
      include: {
        user: true,
        ...makeIncludeWorkAndTagIds(member.userId),
      },
    });

    const updated = db2member(dbUpdated);

    const changes = buildChangeRecord(member, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_UPDATE,
      reqCtx.userId, updated.id, member.boardId,
      changes, reqCtx.sessionId,
    );

    return updated;
  }

  @traced
  static async remove(member: JustMember, reqCtx: RequestContext): Promise<LeaderboardMember> {
    if(member.isOwner) {
      const leaderboard = await LeaderboardModel.get(member.boardId);
      if(!leaderboard) {
        throw new Error(`Cannot remove member from a non-existent board`);
      }

      const members = await this.list(leaderboard);
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
    const removed = db2member(dbRemoved);

    const changes = buildChangeRecord(member, removed);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_DELETE,
      reqCtx.userId, removed.id, member.boardId,
      changes, reqCtx.sessionId,
    );

    return removed;
  }

  @traced
  static async getParticipation(leaderboardId: number, userId: number): Promise<Participation | null> {
    const found = await dbClient.boardParticipant.findUnique({
      where: {
        userId_boardId: {
          userId: userId,
          boardId: leaderboardId,
        },
        state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
        user: { state: USER_STATE.ACTIVE },
      },
      include: makeIncludeWorkAndTagIds(userId),
    });
    if(!found) {
      return null;
    }

    const participation = db2participation(found);
    return participation;
  }

  // TODO: listBannedMembers(), banMember(), unbanMember()
}
