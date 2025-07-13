import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success, failure } from 'server/lib/api-response.ts';

import { RequestWithUser } from 'server/lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam, zDateStr, NonEmptyArray } from 'server/lib/validators.ts';

import dbClient from '../../lib/db.ts';
import type { Tally, Work, Tag } from 'generated/prisma/client';
import { TALLY_STATE, TALLY_MEASURE, TallyMeasure } from 'server/lib/models/tally/consts.ts';
import { TAG_STATE, TAG_DEFAULT_COLOR } from 'server/lib/models/tag/consts.ts';

import { buildChangeRecord, logAuditEvent } from '../../lib/audit-events.ts';
import { WORK_STATE } from 'server/lib/models/work/consts.ts';

export type TallyWithWorkAndTags = Tally & { work: Work } & { tags: Tag[] };

const zTallyQuery = z.object({
  works: z.array(z.coerce.number().int().positive()),
  tags: z.array(z.coerce.number().int().positive()),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<TallyMeasure>),
  startDate: zDateStr(),
  endDate: zDateStr(),
}).partial();

export type TallyQuery = z.infer<typeof zTallyQuery>;

export async function handleGetTallies(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags[]>) {
  const query = req.query as TallyQuery;

  const tallies = await dbClient.tally.findMany({
    where: {
      ownerId: req.user.id,
      state: TALLY_STATE.ACTIVE,

      measure: query.measure ?? undefined,
      date: {
        gte: query.startDate ?? undefined,
        lte: query.endDate ?? undefined,
      },
      workId: query.works ? { in: query.works } : undefined,
      tags: query.tags ? { some: { id: { in: query.tags } } } : undefined,
    },
    include: {
      work: true,
      tags: true,
    },
  });

  return res.status(200).send(success(tallies));
}

export async function handleGetTally(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) {
  const tally = await dbClient.tally.findUnique({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: TALLY_STATE.ACTIVE,
    },
    include: {
      work: true,
      tags: true,
    },
  });

  if(tally) {
    return res.status(200).send(success(tally));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any tally with id ${req.params.id}.`));
  }
}

export type TallyCreatePayload = {
  date: string;
  measure: string;
  count: number;
  setTotal: boolean;
  note: string;
  workId: number | null;
  tags: string[];
};
const zTallyCreatePayload = z.object({
  date: zDateStr(),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
  count: z.number().int(),
  setTotal: z.boolean(),
  note: z.string(), // this CAN be empty
  workId: z.number().int().nullable(),
  tags: z.array(z.string().min(1)), // tags are specified by name, because you might create a new one here
}).strict();

export async function handleCreateTally(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) {
  const user = req.user;
  const payload = req.body as TallyCreatePayload;

  let count = payload.count;
  if(payload.setTotal) {
    if(payload.workId === null) {
      // need a work to set a total, otherwise this doesn't make any sense
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total when no project is specified.'));
    }

    const work = await dbClient.work.findUnique({
      where: {
        state: WORK_STATE.ACTIVE,
        ownerId: user.id,
        id: payload.workId,
      },
    });
    if(!work) {
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total because the project specified was not found.'));
    }

    const tallies = await dbClient.tally.findMany({
      where: {
        state: TALLY_STATE.ACTIVE,
        ownerId: user.id,
        workId: payload.workId,
        measure: payload.measure,
        date: { lte: payload.date },
      },
    });

    const startingBalance = payload.measure in (work.startingBalance as Record<string, number>) ? work.startingBalance[payload.measure] : 0;
    const currentTotal = startingBalance + tallies.reduce((total, tally) => total + tally.count, 0);
    const difference = count - currentTotal;
    count = difference;
  }

  const tally = await dbClient.tally.create({
    data: {
      state: TALLY_STATE.ACTIVE,
      ownerId: user.id,

      date: payload.date,
      measure: payload.measure,
      count: count,
      note: payload.note,

      workId: payload.workId, // could be null

      tags: {
        connectOrCreate: payload.tags.map((tagName: string) => ({
          where: {
            state: TAG_STATE.ACTIVE,
            ownerId_name: { ownerId: user.id, name: tagName },
          },
          create: {
            name: tagName,
            color: TAG_DEFAULT_COLOR,
            state: TAG_STATE.ACTIVE,
            ownerId: user.id,
          },
        })),
      },
    },
    include: {
      work: true,
      tags: true,
    },
  });

  await logAuditEvent('tally:create', user.id, tally.id, null, null, req.sessionID);

  return res.status(201).send(success(tally));
}

const zBatchTallyCreatePayload = z.array(z.object({
  date: zDateStr(),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
  count: z.number().int(),
  setTotal: z.literal(false), // no submitting batch tallies that set the total... for now. // TODO: allow this in future
  note: z.string(), // this CAN be empty
  workId: z.number().int().nullable(),
  tags: z.array(z.string()).length(0), // no tags yet either, sorry // TODO: allow this in future
}));

export async function handleCreateTallies(req: RequestWithUser, res: ApiResponse<Tally[]>) {
  const user = req.user;

  const createdTallies = await dbClient.tally.createManyAndReturn({
    data: req.body.map(tallyData => ({
      state: TALLY_STATE.ACTIVE,
      ownerId: user.id,

      date: tallyData.date,
      measure: tallyData.measure,
      count: tallyData.count,
      note: tallyData.note,

      workId: tallyData.workId, // could be null
    })),
  });

  await Promise.all(createdTallies.map(createdTally => logAuditEvent('tally:create', user.id, createdTally.id, null, null, req.sessionID)));

  return res.status(201).send(success(createdTallies));
}

export type TallyUpdatePayload = Partial<TallyCreatePayload>;
const zTallyUpdatePayload = zTallyCreatePayload.partial();

export async function handleUpdateTally(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) {
  const user = req.user;
  const payload = req.body as TallyUpdatePayload;

  const existingTally = await dbClient.tally.findUnique({
    where: {
      id: +req.params.id,
      ownerId: user.id,
      state: TALLY_STATE.ACTIVE,
    },
    include: {
      tags: true,
    },
  });
  if(!existingTally) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any tally with id ${req.params.id}.`));
  }

  const tagNamesToConnectOrCreate = payload.tags.filter(incomingTag => !existingTally.tags.some(existingTag => existingTag.name === incomingTag));
  const tagsToDisconnect = existingTally.tags.filter(existingTag => !payload.tags.includes(existingTag.name));

  let count = payload.count;
  if(payload.setTotal) {
    if(payload.workId === null) {
      // need a work to set a total, otherwise this doesn't make any sense
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total when no project is specified.'));
    }

    const work = await dbClient.work.findUnique({
      where: {
        state: WORK_STATE.ACTIVE,
        ownerId: user.id,
        id: payload.workId,
      },
    });
    if(!work) {
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total because the project specified was not found.'));
    }

    const tallies = await dbClient.tally.findMany({
      where: {
        state: TALLY_STATE.ACTIVE,
        ownerId: user.id,
        workId: payload.workId,
        measure: payload.measure,
        date: { lte: payload.date },
        id: { notIn: [+req.params.id] },
      },
    });

    const startingBalance = payload.measure in (work.startingBalance as Record<string, number>) ? work.startingBalance[payload.measure] : 0;
    const currentTotal = startingBalance + tallies.reduce((total, tally) => total + tally.count, 0);
    const difference = count - currentTotal;
    count = difference;
  }

  const tally = await dbClient.tally.update({
    where: {
      id: +req.params.id,
      ownerId: user.id,
      state: TALLY_STATE.ACTIVE,
    },
    data: {
      date: payload.date,
      measure: payload.measure,
      count: count,
      note: payload.note,

      workId: payload.workId, // could be null

      tags: {
        connectOrCreate: tagNamesToConnectOrCreate.map((tagName: string) => ({
          where: {
            state: TAG_STATE.ACTIVE,
            ownerId_name: { ownerId: user.id, name: tagName },
          },
          create: {
            name: tagName,
            color: TAG_DEFAULT_COLOR,
            state: TAG_STATE.ACTIVE,
            ownerId: user.id,
          },
        })),
        disconnect: tagsToDisconnect.map(tag => ({ id: tag.id })),
      },
    },
    include: {
      work: true,
      tags: true,
    },
  });

  const changes = buildChangeRecord(existingTally, tally);
  await logAuditEvent('tally:update', user.id, tally.id, null, changes, req.sessionID);

  return res.status(200).send(success(tally));
}

export async function handleDeleteTally(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) {
  const user = req.user;

  // we actually delete deleted tallies
  const tally = await dbClient.tally.delete({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: TALLY_STATE.ACTIVE,
    },
    include: {
      work: true,
      tags: true,
    },
  });

  await logAuditEvent('tally:delete', user.id, tally.id, null, null, req.sessionID);

  return res.status(200).send(success(tally));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetTallies,
    accessLevel: ACCESS_LEVEL.USER,
    querySchema: zTallyQuery,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetTally,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateTally,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zTallyCreatePayload,
  },
  {
    path: '/batch',
    method: HTTP_METHODS.POST,
    handler: handleCreateTallies,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zBatchTallyCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateTally,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
    bodySchema: zTallyUpdatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteTally,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
];

export default routes;
