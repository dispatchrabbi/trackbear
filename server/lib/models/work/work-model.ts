import { traced } from "../../tracer.ts";

import dbClient from "../../db.ts";
import { type Work as PrismaWork } from "@prisma/client";
import type { Create, Update } from "../types.ts";

import { type RequestContext } from "../../request-context.ts";
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import type { User } from '../user/user-model.ts';
import { WORK_PHASE, WORK_STATE, type WorkPhase } from "./consts.ts";
import type { Tally } from '../tally/tally-model.wip.ts';
import { TALLY_STATE } from "../tally/consts.ts";
import { sumTallies } from "../tally/helpers.ts";
import { omit } from "server/lib/obj.ts";
import { type MeasureCounts } from "../tally/types.ts";

export type Work = Omit<PrismaWork, 'phase' | 'startingBalance'> & {
  phase: WorkPhase;
  startingBalance: MeasureCounts;
};
export type SummarizedWork = Work & {
  totals: MeasureCounts;
  lastUpdated: string | null;
};
export type WorkWithTallies = Work & {
  tallies: Tally[];
}

type OptionalWorkFields = 'description' | 'phase' | 'startingBalance' | 'cover';
export type CreateWorkData = Create<Work, OptionalWorkFields>;
export type UpdateWorkData = Update<Work>;

export class WorkModel {

  @traced
  static async getWorks(owner: User): Promise<Work[]> {
    const works = await dbClient.work.findMany({
      where: {
        ownerId: owner.id,
        state: WORK_STATE.ACTIVE,
      }
    }) as Work[];

    return works;
  }

  @traced
  static async getSummarizedWorks(owner: User): Promise<SummarizedWork[]> {
    const worksWithTallies = await dbClient.work.findMany({
      where: {
        ownerId: owner.id,
        state: WORK_STATE.ACTIVE,
      },
      include: {
        tallies: { where: { state: TALLY_STATE.ACTIVE } },
      },
    }) as WorkWithTallies[];

    const summarizedWorks: SummarizedWork[] = worksWithTallies.map(work => {
      const totals = sumTallies(work.tallies, work.startingBalance);

      const lastUpdated = work.tallies.length > 0 ? work.tallies.reduce((last, tally) => {
        return tally.date > last ? tally.date : last
      }, '0000-00-00') : null;

      return {
        ...omit(work, ['tallies']),
        totals,
        lastUpdated
      };
    });

    return summarizedWorks;
  }

  @traced
  static async getWork(owner: User, id: number): Promise<Work | null> {
    const work = await dbClient.work.findUnique({
      where: {
        id,
        ownerId: owner.id,
        state: WORK_STATE.ACTIVE,
      }
    }) as Work;

    return work;
  }

  @traced
  static async createWork(owner: User, data: CreateWorkData, reqCtx: RequestContext): Promise<Work> {
    
    const dataWithDefaults: Required<CreateWorkData> = Object.assign({
      description: '',
      phase: WORK_PHASE.PLANNING,
      startingBalance: {},
      cover: null,
      starred: false,
      displayOnProfile: false,
    }, data);

    const created = await dbClient.work.create({
      data: {
        ...dataWithDefaults,
        state: WORK_STATE.ACTIVE,
        ownerId: owner.id,
      },
    }) as Work;

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.WORK_CREATE,
      reqCtx.userId, created.id, null,
      changes, reqCtx.sessionId
    );

    return created;
  }

  @traced
  static async updateWork(owner: User, work: Work, data: UpdateWorkData, reqCtx: RequestContext): Promise<Work> {
    const updated = await dbClient.work.update({
      where: {
        id: work.id,
        ownerId: owner.id,
        state: WORK_STATE.ACTIVE,
      },
      data: {
        ...data,
      },
    }) as Work;

    const changes = buildChangeRecord(work, updated);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.WORK_UPDATE,
      reqCtx.userId, updated.id, null,
      changes, reqCtx.sessionId
    );

    return updated;
  }

  @traced
  static async deleteWork(owner: User, work: Work, reqCtx: RequestContext): Promise<Work> {
    // when deleting a work, we set the status to deleted and set the associated tally statuses to deleted as well
    // that makes it easy to un-delete a work if a user asks us to
    const deleted = await dbClient.work.update({
      where: {
        id: work.id,
        ownerId: owner.id,
        state: WORK_STATE.ACTIVE,
      },
      data: {
        state: WORK_STATE.DELETED,
        tallies: {
          updateMany: {
            where: { state: TALLY_STATE.ACTIVE },
            data: { state: TALLY_STATE.DELETED },
          }
        },
      },
    }) as Work;

    const changes = buildChangeRecord(work, deleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.WORK_DELETE,
      reqCtx.userId, deleted.id, null,
      changes, reqCtx.sessionId
    );

    return deleted;
  }

  @traced
  static async undeleteWork(owner: User, work: Work, reqCtx: RequestContext): Promise<Work> {
    // this is the inverse of deleting: the work is activated and the tallies are as well
    const undeleted = await dbClient.work.update({
      where: {
        id: work.id,
        ownerId: owner.id,
        state: WORK_STATE.DELETED,
      },
      data: {
        state: WORK_STATE.ACTIVE,
        tallies: {
          updateMany: {
            where: { state: TALLY_STATE.DELETED },
            data: { state: TALLY_STATE.ACTIVE },
          }
        },
      },
    }) as Work;

    const changes = buildChangeRecord(work, undeleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.WORK_UNDELETE,
      reqCtx.userId, undeleted.id, null,
      changes, reqCtx.sessionId
    );

    return undeleted;
  }

}