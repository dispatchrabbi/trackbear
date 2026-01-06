import { getDbClient } from 'server/lib/db.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import type { User } from '../user/user-model.ts';
import type { Tally, PlainTally } from './types.ts';
import { TALLY_STATE, type TallyMeasure } from './consts.ts';
import { db2tally } from './helpers.ts';

import { traced } from '../../metrics/tracer.ts';

export type {
  Tally, PlainTally,
};

export type TallyData = {
  date: string;
  measure: TallyMeasure;
  count: number;
  note: string;
  workId: number;
  tags: string[];
};
export type BatchTallyData = Omit<TallyData, 'tags'>;

export type TallyFilter = {
  measure?: TallyMeasure;
  startDate?: string;
  endDate?: string;
  workIds?: number[];
  tagIds?: number[];
};

export class TallyModel {
  @traced
  static async getTallies(owner: User, filter: TallyFilter = {}): Promise<Tally[]> {
    const db = getDbClient();
    const found = await db.tally.findMany({
      where: {
        ownerId: owner.id,
        state: TALLY_STATE.ACTIVE,

        measure: filter.measure ?? undefined,
        date: {
          gte: filter.startDate ?? undefined,
          lte: filter.endDate ?? undefined,
        },
        workId: (filter.workIds ?? []).length > 0 ? { in: filter.workIds } : undefined,
        tags: filter.tagIds ? { some: { id: { in: filter.tagIds } } } : undefined,
      },
      include: {
        tags: { select: { id: true } },
      },
    });

    const tallies = found.map(db2tally) as Tally[];
    return tallies;
  }

  @traced
  static async getTally(owner: User, id: number): Promise<Tally | null> {
    const db = getDbClient();
    const found = await db.tally.findUnique({
      where: {
        id: id,
        ownerId: owner.id,
      },
      include: {
        tags: { select: { id: true } },
      },
    });

    const tally = db2tally(found);
    return tally;
  }

  @traced
  static async createTally(/* owner: User, data: TallyData, reqCtx: RequestContext */): Promise<Tally> {
    // @ts-expect-error
    return null;
  }

  // TODO: move this to a batch creation domain
  @traced
  static async batchCreateTallies(owner: User, data: BatchTallyData[], reqCtx: RequestContext): Promise<PlainTally[]> {
    const db = getDbClient();
    const createds = await db.tally.createManyAndReturn({
      data: data.map(tallyData => ({
        state: TALLY_STATE.ACTIVE,
        ownerId: owner.id,

        date: tallyData.date,
        measure: tallyData.measure,
        count: tallyData.count,
        note: tallyData.note,

        workId: tallyData.workId,
      })),
    });

    await Promise.all(createds.map(created => {
      const changes = buildChangeRecord({}, created);
      return logAuditEvent(AUDIT_EVENT_TYPE.TALLY_CREATE,
        reqCtx.userId, created.id, null,
        changes, reqCtx.sessionId,
      );
    }));

    return createds;
  }

  @traced
  static async updateTally(/* owner: User, tally: Tally, data: Partial<TallyData>, reqCtx: RequestContext */): Promise<Tally> {
    // @ts-expect-error
    return null;
  }

  @traced
  static async deleteTally(owner: User, tally: Tally, reqCtx: RequestContext): Promise<Tally> {
    // we actually delete deleted tallies
    const db = getDbClient();
    const dbDeleted = await db.tally.delete({
      where: {
        id: tally.id,
        ownerId: owner.id,
        state: TALLY_STATE.ACTIVE,
      },
      include: {
        tags: { select: { id: true } },
      },
    });
    const deleted = db2tally(dbDeleted)!;

    const changes = buildChangeRecord(tally, deleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.TALLY_DELETE,
      reqCtx.userId, deleted.id, null,
      changes, reqCtx.sessionId,
    );

    return tally;
  }
}
