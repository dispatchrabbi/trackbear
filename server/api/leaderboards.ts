import { Router, Request } from "express";
import { ApiResponse, failure, success } from '../lib/api-response.ts';

import { z } from 'zod';
import { zStrInt, zDateStr } from '../lib/validators.ts';

import dbClient from "../lib/db.ts";
import type { Leaderboard, Project, Update } from "@prisma/client";
import { requireUser, WithUser } from '../lib/auth.ts';
import { PROJECT_STATE, LEADERBOARD_STATE, LEADERBOARD_GOAL_TYPE } from '../lib/states.ts';

import { validateBody, validateParams } from "../lib/middleware/validate.ts";
import { logAuditEvent } from '../lib/audit-events.ts';

type ProjectWithOwnerAndUpdates = Project & { updates: Update[] } & { owner: { displayName: string; } };
export type CompleteLeaderboard = Leaderboard & { projects: ProjectWithOwnerAndUpdates[] };

type CreateLeaderboardPayloadProps = 'title' | 'type' | 'goal' | 'startDate' | 'endDate';
export type CreateLeaderboardPayload  = Pick<Leaderboard, CreateLeaderboardPayloadProps>;
const createLeaderboardPayloadSchema = z.object({
  title: z.string(),
  type: z.enum(Object.values(LEADERBOARD_GOAL_TYPE) as [string, ...string[]]),
  goal: z.number().int().nullable(),
  startDate: zDateStr().nullable(),
  endDate: zDateStr().nullable(),
});

type EditLeaderboardPayloadProps = 'title' | 'goal' | 'startDate' | 'endDate';
export type EditLeaderboardPayload  = Pick<Leaderboard, EditLeaderboardPayloadProps>;
const editLeaderboardPayloadSchema = z.object({
  title: z.string(),
  goal: z.number().int().nullable(),
  startDate: zDateStr().nullable(),
  endDate: zDateStr().nullable(),
});

const leaderboardsRouter = Router();

// GET /leaderboards - return all leaderboards this user owns or is part of
leaderboardsRouter.get('/',
  requireUser,
  async (req, res: ApiResponse<CompleteLeaderboard[]>, next) =>
{
    let leaderboards: CompleteLeaderboard[];
  try {
    leaderboards = await dbClient.leaderboard.findMany({
      where: { OR: [
        // these are the ones the current user owns
        {
          ownerId: (req as WithUser<Request>).user.id,
          state: LEADERBOARD_STATE.ACTIVE,
        },
        // these are the ones the current user has a project in
        { projects: { some: {
          ownerId: (req as WithUser<Request>).user.id,
          state: PROJECT_STATE.ACTIVE,
        } } },
      ]},
      include: {
        projects: {
          where: { state: PROJECT_STATE.ACTIVE },
          include: {
            updates: true,
            owner: {
              select: { displayName: true }
            },
          },
        },
      },
    });
  } catch(err) { return next(err); }

  return res.status(200).send(success(leaderboards));
});

// GET /leaderboards/:id - return the given leaderboard
leaderboardsRouter.get('/:uuid',
  requireUser,
  validateParams(z.object({ uuid: z.string().uuid() })),
  async (req, res: ApiResponse<CompleteLeaderboard>, next) =>
{
  let leaderboard: CompleteLeaderboard | null;
  try {
    leaderboard = await dbClient.leaderboard.findUnique({
      where: {
        uuid: req.params.uuid,
        state: LEADERBOARD_STATE.ACTIVE,
      },
      include: {
        projects: {
          where: { state: PROJECT_STATE.ACTIVE },
          include: {
            updates: true,
            owner: true,
          },
        },
      },
    });
  } catch(err) { return next(err); }

  if(leaderboard) {
    return res.status(200).send(success(leaderboard));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${req.params.uuid}.`));
  }
});

// POST /leaderboards - add a new leaderboard
leaderboardsRouter.post('/',
  requireUser,
  validateBody(createLeaderboardPayloadSchema),
  async (req, res: ApiResponse<CompleteLeaderboard>, next) =>
{
  // some additional validation
  if(req.body.type === LEADERBOARD_GOAL_TYPE.PERCENTAGE && req.body.goal !== null) {
    res.status(400).send(failure('VALIDATION_FAILED', `Payload validation failed: goal must be null when leaderboard type is ${LEADERBOARD_GOAL_TYPE.PERCENTAGE}}`));
  }

  const user = (req as WithUser<Request>).user;
  let leaderboard: CompleteLeaderboard;
  try {
    leaderboard = await dbClient.leaderboard.create({
      data: {
        ...req.body as CreateLeaderboardPayload,
        state: LEADERBOARD_STATE.ACTIVE,
        ownerId: user.id
      },
      include: {
        projects: {
          where: { state: PROJECT_STATE.ACTIVE },
          include: {
            updates: true,
            owner: true,
          },
        },
      },
    });
    await logAuditEvent('leaderboard:create', user.id, leaderboard.id);
  } catch(err) { return next(err); }

  return res.status(201).send(success(leaderboard));
});

// POST /leaderboards/:uuid - edit a leaderboard
leaderboardsRouter.post('/:uuid',
  requireUser,
  validateParams(z.object({ uuid: z.string().uuid() })),
  validateBody(editLeaderboardPayloadSchema),
  async (req, res: ApiResponse<CompleteLeaderboard>, next) =>
{
  const user = (req as WithUser<Request>).user;

  // first we have to make sure the leaderboard exists
  let checkLeaderboard: Leaderboard | null;
  try {
    checkLeaderboard = await dbClient.leaderboard.findUnique({
      where: {
        uuid: req.params.uuid,
        ownerId: user.id,
        state: LEADERBOARD_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!checkLeaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${req.params.uuid}.`));
  }

  // some additional validation
  if(checkLeaderboard.type === LEADERBOARD_GOAL_TYPE.PERCENTAGE && req.body.goal !== null) {
    res.status(400).send(failure('VALIDATION_FAILED', `Payload validation failed: goal must be null when leaderboard type is ${LEADERBOARD_GOAL_TYPE.PERCENTAGE}}`));
  }

  // now we can edit
  let leaderboard: CompleteLeaderboard;
  try {
    leaderboard = await dbClient.leaderboard.update({
      data: {
        // this is safe because our validation removes extra properties
        ...req.body as EditLeaderboardPayload,
      },
      where: {
        id: +req.params.id,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      },
      include: {
        projects: {
          where: { state: PROJECT_STATE.ACTIVE },
          include: {
            updates: true,
            owner: true,
          },
        },
      },
    });
    await logAuditEvent('leaderboard:edit', user.id, leaderboard.id);
  } catch(err) { return next(err); }

  return res.status(200).send(success(leaderboard));
});

// DELETE /leaderboards/:id - delete a leaderboard
leaderboardsRouter.delete('/:uuid',
  requireUser,
  validateParams(z.object({ uuid: z.string().uuid() })),
  async (req, res: ApiResponse<null>, next) =>
{
  return res.status(500).send(failure('NOT_IMPLEMENTED', 'Not yet implemented'));
});

// GET /leaderboards/:uuid/eligible-projects - get all projects for this user that are eligible for adding to this leaderboard
leaderboardsRouter.get('/:uuid/eligible-projects',
  requireUser,
  validateParams(z.object({ uuid: z.string().uuid() })),
  async (req, res: ApiResponse<Project[]>, next) =>
{
  let leaderboard: Leaderboard | null;
  try {
    leaderboard = await dbClient.leaderboard.findUnique({
      where: {
        uuid: req.params.uuid,
        state: LEADERBOARD_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with id ${req.params.uuid}.`));
  }

  // now we have to figure out which projects are eligible for the leaderboard
  // I think that, for now, we won't worry about the date issues and we'll just go by goal type
  const eligibleProjectsWhereFilter: Record<string, unknown> = {};
  if(leaderboard.type === LEADERBOARD_GOAL_TYPE.PERCENTAGE) {
    // for a percentage leaderboard, we only care that the project _has_ a goal
    eligibleProjectsWhereFilter.goal = { not: null };
  } else {
    // for any other kind of leaderboard, the goal has to match
    eligibleProjectsWhereFilter.type = leaderboard.type;
  }

  const user = (req as WithUser<Request>).user;
  let projects: Project[];
  try {
    projects = await dbClient.project.findMany({
      where: {
        ...eligibleProjectsWhereFilter,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  return res.status(200).send(success(projects));
});

// POST /leaderboards/:uuid/projects - add a project to a leaderboard
// To be honest, I'm nost sure how I feel about using a UUID for one and an ID for the other
// Or that the add and remove don't mirror each other
// I probably will change this in the future API rewrite
leaderboardsRouter.post('/:uuid/projects',
  requireUser,
  validateParams(z.object({ uuid: z.string().uuid() })),
  validateBody(z.object({ projectId: z.number().int() })),
  async (req, res: ApiResponse<CompleteLeaderboard>, next) =>
{
  const user = (req as WithUser<Request>).user;

  // first we have to make sure the leaderboard exists
  let checkLeaderboard: Leaderboard | null;
  try {
    checkLeaderboard = await dbClient.leaderboard.findUnique({
      where: {
        uuid: req.params.uuid,
        state: LEADERBOARD_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!checkLeaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${req.params.uuid}.`));
  }

  // then we have to make sure the project exists and is owned by the logged-in user
  let checkProject: Project | null;
  try {
    checkProject = await dbClient.project.findUnique({
      where: {
        id: req.body.projectId,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!checkProject) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.body.projectId}.`));
  }

  let leaderboard;
  try {
    leaderboard = await dbClient.leaderboard.update({
      where: {
        uuid: req.params.uuid,
        state: LEADERBOARD_STATE.ACTIVE,
      },
      data: {
        projects: {
          connect: { id: req.body.projectId },
        },
      },
      include: {
        projects: {
          where: { state: PROJECT_STATE.ACTIVE },
          include: {
            updates: true,
            owner: true,
          },
        },
      }
    });
    await logAuditEvent('leaderboard:add-project', user.id, leaderboard.id, checkProject.id);
  } catch(err) { return next(err); }

  return res.status(200).send(success(leaderboard));
});

// DELETE /leaderboards/:leaderboardId/projects/:projectId - remove a project from a leaderboard
leaderboardsRouter.delete('/:leaderboardUuid/projects/:projectId',
  requireUser,
  validateParams(z.object({ leaderboardUuid: z.string().uuid(), projectId: zStrInt() })),
  async (req, res: ApiResponse<CompleteLeaderboard>, next) =>
{

  // first we have to make sure the leaderboard exists
  let checkLeaderboard: Leaderboard | null;
  try {
    checkLeaderboard = await dbClient.leaderboard.findUnique({
      where: {
        uuid: req.params.leaderboardUuid,
        state: LEADERBOARD_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!checkLeaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${req.params.leaderboardUuid}.`));
  }

  // then we have to make sure the project exists and is owned by the logged-in user
  const user = (req as WithUser<Request>).user;
  let checkProject: Project | null;
  try {
    checkProject = await dbClient.project.findUnique({
      where: {
        id: +req.params.projectId,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!checkProject) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.projectId}.`));
  }

  // it's safe to disconnect the project without first checking if it exists; prisma just won't do anything in that case
  let leaderboard: CompleteLeaderboard;
  try {
    leaderboard = await dbClient.leaderboard.update({
      where: {
        uuid: req.params.leaderboardUuid,
        state: LEADERBOARD_STATE.ACTIVE,
      },
      data: {
        projects: {
          disconnect: { id: +req.params.projectId },
        },
      },
      include: {
        projects: {
          where: { state: PROJECT_STATE.ACTIVE },
          include: {
            updates: true,
            owner: true,
          },
        },
      },
    });
    await logAuditEvent('leaderboard:remove-project', user.id, leaderboard.id, checkProject.id);
  } catch(err) { return next(err); }

  return res.status(200).send(success(leaderboard));
});

export default leaderboardsRouter;
