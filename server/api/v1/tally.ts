import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam, zDateStr, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams, validateQuery } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Tally, Work, Tag } from "@prisma/client";
import { TALLY_STATE, TALLY_MEASURE } from '../../lib/entities/tally.ts';
import { TAG_STATE, TAG_DEFAULT_COLOR } from '../../lib/entities/tag.ts';

import { logAuditEvent } from '../../lib/audit-events.ts';

const tallyRouter = Router();
export default tallyRouter;

export type TallyWithWorkAndTags = Tally & { work: Work } & { tags: Tag[] };

const zTallyQuery = z.object({
  works: z.array(z.coerce.number().int().positive()).optional(),
  tags: z.array(z.coerce.number().int().positive()).optional(),
});

export type TallyQuery = z.infer<typeof zTallyQuery>;

tallyRouter.get('/',
  requireUser,
  validateQuery(zTallyQuery),
  h(async (req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags[]>) =>
{
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
}));

tallyRouter.get('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(async (req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) =>
{
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
}));

export type TallyPayload = {
  date: string;
  measure: string;
  count: number;
  note: string;
  workId: number | null;
  tags: string[];
};
const zTallyPayload = z.object({
  date: zDateStr(),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
  count: z.number().int(),
  note: z.string(), // this CAN be empty
  workId: z.number().int().nullable(),
  tags: z.array(z.string().min(1)), // tags are specified by name, because you might create a new one here
});

tallyRouter.post('/',
  requireUser,
  validateBody(zTallyPayload),
  h(async (req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) =>
{
  const user = req.user;

  const tally = await dbClient.tally.create({
    data: {
      state: TALLY_STATE.ACTIVE,
      ownerId: user.id,

      date: req.body.date,
      measure: req.body.measure,
      count: req.body.count,
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

  await logAuditEvent('tally:create', user.id, tally.id);

  return res.status(201).send(success(tally));
}));

tallyRouter.put('/:id',
  requireUser,
  validateParams(zIdParam()),
  validateBody(zTallyPayload),
  h(async (req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) =>
{
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

  const tally = await dbClient.tally.update({
    where: {
      id: +req.params.id,
      ownerId: user.id,
      state: TALLY_STATE.ACTIVE,
    },
    data: {
      date: req.body.date,
      measure: req.body.measure,
      count: req.body.count,
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

  await logAuditEvent('tally:update', user.id, tally.id);

  return res.status(200).send(success(tally));
}));

tallyRouter.delete('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(async (req: RequestWithUser, res: ApiResponse<TallyWithWorkAndTags>) =>
{
  const user = req.user;

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

  await logAuditEvent('tally:delete', user.id, tally.id);

  return res.status(200).send(success(tally));
}));
