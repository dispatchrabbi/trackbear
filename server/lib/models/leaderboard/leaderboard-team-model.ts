import { traced } from '../../metrics/tracer.ts';

import { getDbClient } from 'server/lib/db.ts';
import type { Create, Update } from '../types.ts';
import { supplyDefaults } from '../helpers.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import { Leaderboard, LeaderboardTeam } from './types.ts';

export type CreateLeaderboardTeamData = Create<LeaderboardTeam, 'color', 'boardId'>;
export type UpdateLeaderboardTeamData = Update<LeaderboardTeam, 'boardId'>;

export class LeaderboardTeamModel {
  @traced
  static async list(leaderboard: Leaderboard): Promise<LeaderboardTeam[]> {
    const db = getDbClient();
    const teams = await db.boardTeam.findMany({
      where: {
        boardId: leaderboard.id,
      },
    });

    return teams;
  }

  @traced
  static async get(id: number): Promise<LeaderboardTeam | null> {
    const db = getDbClient();
    const team = await db.boardTeam.findUnique({
      where: {
        id: id,
      },
    });

    return team;
  }

  @traced
  static async create(leaderboard: Leaderboard, data: CreateLeaderboardTeamData, reqCtx: RequestContext): Promise<LeaderboardTeam> {
    const dataWithDefaults = supplyDefaults(data, { color: '' });

    const db = getDbClient();
    const created = await db.boardTeam.create({
      data: {
        ...dataWithDefaults,
        boardId: leaderboard.id,
      },
    });

    const changeRecord = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_TEAM_CREATE, reqCtx.userId, created.id, created.boardId, changeRecord, reqCtx.sessionId);

    return created;
  };

  @traced
  static async update(team: LeaderboardTeam, data: UpdateLeaderboardTeamData, reqCtx: RequestContext): Promise<LeaderboardTeam> {
    const db = getDbClient();
    const updated = await db.boardTeam.update({
      where: {
        id: team.id,
      },
      data,
    });

    const changeRecord = buildChangeRecord(team, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_TEAM_UPDATE, reqCtx.userId, updated.id, updated.boardId, changeRecord, reqCtx.sessionId);

    return updated;
  };

  @traced
  static async delete(team: LeaderboardTeam, reqCtx: RequestContext): Promise<LeaderboardTeam> {
    const db = getDbClient();
    const deleted = await db.boardTeam.delete({
      where: {
        id: team.id,
      },
    });

    const changeRecord = buildChangeRecord(deleted, {});
    await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_TEAM_DELETE, reqCtx.userId, deleted.id, deleted.boardId, changeRecord, reqCtx.sessionId);

    return deleted;
  };
}
