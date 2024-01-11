import { Router, Request } from "express";
import { ApiResponse, success, failure } from '../lib/api-response.ts';

import { z } from 'zod';
import { zStrInt, zDateStr } from '../lib/validators.ts';

import dbClient from "../lib/db.ts";
import type { Project, Update } from "@prisma/client";
import { requireUser, WithUser } from '../lib/auth.ts';
import { PROJECT_STATE, PROJECT_VISIBILITY, PROJECT_TYPE } from '../lib/states.ts';

import { validateBody, validateParams } from "../lib/middleware/validate.ts";
import { logAuditEvent } from '../lib/audit-events.ts';

export type CreateProjectPayload = {
  title: string;
  type: 'words' | 'time' | 'pages' | 'chapters';
  goal: number | null;
  startDate: string | null;
  endDate: string | null;
  visibility: 'public' | 'private';
};

export type EditProjectPayload = {
  title: string;
  goal: number | null;
  startDate: string | null;
  endDate: string | null;
  visibility: 'public' | 'private';
};

export type CreateUpdatePayload = {
  date: string;
  value: number;
};

type ReducedOwner = { uuid: string; title: string; }
export type ProjectWithUpdates = Project & { updates: Update[] };
export type ProjectWithUpdatesAndLeaderboards = ProjectWithUpdates & { leaderboards: ReducedOwner[] };

const projectsRouter = Router();

// GET /projects - return all projects for the user
projectsRouter.get('/',
  requireUser,
  async (req: WithUser<Request>, res: ApiResponse<ProjectWithUpdates[]>, next) =>
{
  let projects: ProjectWithUpdates[];
  try {
    projects = await dbClient.project.findMany({
      where: {
        ownerId: req.user.id,
        state: PROJECT_STATE.ACTIVE,
      },
      include: {
        updates: true,
      },
    });
  } catch(err) { return next(err); }

  return res.status(200).send(success(projects));
});

// GET /projects/:id - return a specific project
projectsRouter.get('/:id',
  requireUser,
  validateParams(z.object({ id: zStrInt() })),
  async (req: WithUser<Request>, res: ApiResponse<ProjectWithUpdatesAndLeaderboards>, next) =>
{
  let project: ProjectWithUpdatesAndLeaderboards | null;
  try {
    project = await dbClient.project.findUnique({
      where: {
        id: +req.params.id,
        ownerId: req.user.id,
        state: PROJECT_STATE.ACTIVE,
      },
      include: {
        updates: true,
        leaderboards: {
          select: {
            uuid: true,
            title: true,
          },
        }
      },
    });
  } catch(err) { return next(err); }

  if(project) {
    return res.status(200).send(success(project));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }
});

// POST /projects - create a new project
projectsRouter.post('/',
  requireUser,
  validateBody(z.object({
    title: z.string(),
    type: z.enum(Object.values(PROJECT_TYPE) as [string, ...string[]]),
    goal: z.number().int().nullable(),
    startDate: zDateStr().nullable(),
    endDate: zDateStr().nullable(),
    visibility: z.enum(Object.values(PROJECT_VISIBILITY) as [string, ...string[]])
  })),
  async (req: WithUser<Request>, res: ApiResponse<ProjectWithUpdates>, next) =>
{
  const user = req.user;
  let project: ProjectWithUpdates;
  try {
    project = await dbClient.project.create({
      data: {
        ...req.body as CreateProjectPayload,
        state: PROJECT_STATE.ACTIVE,
        starred: false,
        ownerId: user.id
      },
      include: {
        updates: true,
      },
    });
    await logAuditEvent('project:create', user.id, project.id);
  } catch(err) { return next(err); }

  return res.status(201).send(success(project));
});

// POST /projects/:id - edit the given project
projectsRouter.post('/:id',
  requireUser,
  validateParams(z.object({ id: zStrInt() })),
  validateBody(z.object({
    title: z.string(),
    goal: z.number().int().nullable(),
    startDate: zDateStr().nullable(),
    endDate: zDateStr().nullable(),
    visibility: z.enum(Object.values(PROJECT_VISIBILITY) as [string, ...string[]])
  })),
  async (req: WithUser<Request>, res: ApiResponse<ProjectWithUpdates>, next) =>
{
  const user = req.user;

  // first we have to make sure the project exists
  let checkProject: Project | null;
  try {
    checkProject = await dbClient.project.findUnique({
      where: {
        id: +req.params.id,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!checkProject) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }

  // now we can edit
  let project: ProjectWithUpdates;
  try {
    project = await dbClient.project.update({
      data: {
        // this is safe because our validation removes extra properties
        ...req.body as EditProjectPayload,
      },
      where: {
        id: +req.params.id,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      },
      include: {
        updates: true,
      },
    });
    await logAuditEvent('project:edit', user.id, project.id);
  } catch(err) { return next(err); }

  return res.status(200).send(success(project));
});

// DELETE /projects/:id - delete the given project
projectsRouter.delete('/:id',
  requireUser,
  validateParams(z.object({ id: zStrInt() })),
  async (req, res: ApiResponse<null>, next) =>
{
  return res.status(500).send(failure('NOT_IMPLEMENTED', 'Not yet implemented'));
});

// POST /projects/:id/update - log an update to a project
projectsRouter.post('/:id/update',
  requireUser,
  validateParams(z.object({ id: zStrInt() })),
  validateBody(z.object({ date: zDateStr(), value: z.number().int() })),
  async (req: WithUser<Request>, res: ApiResponse<Update>, next) =>
{
  // first, make sure the project exists
  const user = req.user;
  let project: Project | null;
  try {
    project = await dbClient.project.findUnique({
      where: {
        id: +req.params.id,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!project) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }

  // now, add the update
  let update: Update;
  try {
    update = await dbClient.update.create({
      data: {
        ...req.body as CreateUpdatePayload,
        projectId: project.id,
      },
    });
    await logAuditEvent('update:create', user.id, update.id, project.id);
  } catch(err) { return next(err); }

  return res.status(201).send(success(update));
});

// POST /projects/:projectId/update/:updateId
projectsRouter.post('/:projectId/update/:updateId',
  requireUser,
  validateParams(z.object({ projectId: zStrInt(), updateId: zStrInt() })),
  validateBody(z.object({ date: zDateStr(), value: z.number().int() })),
  async (req: WithUser<Request>, res: ApiResponse<Update>, next) =>
{
  // first, make sure the project exists
  const user = req.user;
  let project: Project | null;
  try {
    project = await dbClient.project.findUnique({
      where: {
        id: +req.params.projectId,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!project) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }

  let update: Update;
  try {
    update = await dbClient.update.update({
      data: {
        ...req.body as CreateUpdatePayload,
      },
      where: {
        id: +req.params.updateId,
        projectId: project.id,
      }
    });
    await logAuditEvent('update:edit', user.id, update.id, project.id);
  } catch(err) { return next(err); }

  return res.status(200).send(success(update));
});

projectsRouter.delete('/:projectId/update/:updateId',
  requireUser,
  validateParams(z.object({ projectId: zStrInt(), updateId: zStrInt() })),
  async (req: WithUser<Request>, res: ApiResponse<null>, next) =>
{
  // first, make sure the project exists
  const user = req.user;
  let project: Project | null;
  try {
    project = await dbClient.project.findUnique({
      where: {
        id: +req.params.projectId,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!project) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }

  let update: Update;
  try {
    update = await dbClient.update.delete({
      where: {
        id: +req.params.updateId,
        projectId: project.id,
      }
    });
    await logAuditEvent('update:delete', user.id, update.id, project.id);
  } catch(err) { return next(err); }

  return res.status(200).send(success(null));
});

export default projectsRouter;
