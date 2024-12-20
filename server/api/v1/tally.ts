import { Router } from "express";
import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from "server/lib/api.ts";
import { ApiResponse, success, failure, h } from 'server/lib/api-response.ts';

import { requireUser, RequestWithUser } from 'server/lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam, zDateStr, NonEmptyArray } from 'server/lib/validators.ts';
import { validateBody, validateParams, validateQuery } from "server/lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Tally, Work, Tag } from "@prisma/client";
import { TALLY_STATE, TALLY_MEASURE } from 'server/lib/models/tally.ts';
import { TAG_STATE, TAG_DEFAULT_COLOR } from 'server/lib/models/tag.ts';

import { logAuditEvent } from '../../lib/audit-events.ts';
import { WORK_STATE } from "server/lib/models/work.ts";

export const tallyRouter = Router();

export type TallyWithWorkAndTags = Tally & { work: Work } & { tags: Tag[] };

const zTallyQuery = z.object({
  works: z.array(z.coerce.number().int().positive()).optional(),
  tags: z.array(z.coerce.number().int().positive()).optional(),
});

export type TallyQuery = z.infer<typeof zTallyQuery>;

tallyRouter.get('/',
  requireUser,
  validateQuery(zTallyQuery),
  h(handleGetTallies)
);
export async function handleGetTallies(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags[]>) {
  const query = req.query as TallyQuery;

  const tallies = await dbClient.tally.findMany({
    where: {
      ownerId: req.user.id,
      state: TALLY_STATE.ACTIVE,
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

tallyRouter.get('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(handleGetTally)
);
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

export type TallyPayload = {
  date: string;
  measure: string;
  count: number;
  setTotal: boolean;
  note: string;
  workId: number | null;
  tags: string[];
};
const zTallyPayload = z.object({
  date: zDateStr(),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
  count: z.number().int(),
  setTotal: z.boolean(),
  note: z.string(), // this CAN be empty
  workId: z.number().int().nullable(),
  tags: z.array(z.string().min(1)), // tags are specified by name, because you might create a new one here
});

tallyRouter.post('/',
  requireUser,
  validateBody(zTallyPayload),
  h(handleCreateTally)
);
export async function handleCreateTally(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) {
  const user = req.user;

  let count = req.body.count;
  if(req.body.setTotal) {
    if(req.body.workId === null) {
      // need a work to set a total, otherwise this doesn't make any sense
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total when no project is specified.'));
    }

    const work = await dbClient.work.findUnique({
      where: {
        state: WORK_STATE.ACTIVE,
        ownerId: user.id,
        id: req.body.workId,
      },
    });
    if(!work) {
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total because the project specified was not found.'));
    }

    const tallies = await dbClient.tally.findMany({
      where: {
        state: TALLY_STATE.ACTIVE,
        ownerId: user.id,
        workId: req.body.workId,
        measure: req.body.measure,
        date: { lte: req.body.date },
      },
    });

    const startingBalance = req.body.measure in (work.startingBalance as Record<string, number>) ? work.startingBalance[req.body.measure] : 0;
    const currentTotal = startingBalance + tallies.reduce((total, tally) => total + tally.count, 0);
    const difference = count - currentTotal;
    count = difference;
  }

  const tally = await dbClient.tally.create({
    data: {
      state: TALLY_STATE.ACTIVE,
      ownerId: user.id,

      date: req.body.date,
      measure: req.body.measure,
      count: count,
      note: req.body.note,

      workId: req.body.workId, // could be null

      tags: {
        connectOrCreate: req.body.tags.map((tagName: string) => ({
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

const zBatchTallyPayload = z.array(z.object({
  date: zDateStr(),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
  count: z.number().int(),
  setTotal: z.literal(false), // no submitting batch tallies that set the total... for now. // TODO: allow this in future
  note: z.string(), // this CAN be empty
  workId: z.number().int().nullable(),
  tags: z.array(z.string()).length(0), // no tags yet either, sorry // TODO: allow this in future
}));

tallyRouter.post('/batch',
  requireUser,
  validateBody(zBatchTallyPayload),
  h(handleCreateTallies)
);
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

tallyRouter.put('/:id',
  requireUser,
  validateParams(zIdParam()),
  validateBody(zTallyPayload),
  h(handleUpdateTally)
);
export async function handleUpdateTally(req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) {
  const user = req.user;

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

  const tagNamesToConnectOrCreate = req.body.tags.filter(incomingTag => !existingTally.tags.includes(incomingTag));
  const tagsToDisconnect = existingTally.tags.filter(existingTag => !req.body.tags.includes(existingTag.name));

  let count = req.body.count;
  if(req.body.setTotal) {
    if(req.body.workId === null) {
      // need a work to set a total, otherwise this doesn't make any sense
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total when no project is specified.'));
    }

    const work = await dbClient.work.findUnique({
      where: {
        state: WORK_STATE.ACTIVE,
        ownerId: user.id,
        id: req.body.workId,
      },
    });
    if(!work) {
      return res.status(400).send(failure('CANNOT_SET_TOTAL', 'Cannot set total because the project specified was not found.'));
    }

    const tallies = await dbClient.tally.findMany({
      where: {
        state: TALLY_STATE.ACTIVE,
        ownerId: user.id,
        workId: req.body.workId,
        measure: req.body.measure,
        date: { lte: req.body.date },
        id: { notIn: [ +req.params.id ] },
      },
    });

    const startingBalance = req.body.measure in (work.startingBalance as Record<string, number>) ? work.startingBalance[req.body.measure] : 0;
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
      date: req.body.date,
      measure: req.body.measure,
      count: count,
      note: req.body.note,

      workId: req.body.workId, // could be null

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

  await logAuditEvent('tally:update', user.id, tally.id, null, null, req.sessionID);

  return res.status(200).send(success(tally));
}

tallyRouter.delete('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(handleDeleteTally)
);
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
    bodySchema: zTallyPayload,
  },
  {
    path: '/batch',
    method: HTTP_METHODS.POST,
    handler: handleCreateTallies,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zBatchTallyPayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PUT,
    handler: handleUpdateTally,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
    bodySchema: zTallyPayload,
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