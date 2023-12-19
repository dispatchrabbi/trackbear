import { Router, Request } from "express";
import { ApiResponse, success, failure } from './common.ts';

import { z } from 'zod';
import { zInt, zStrInt, zDateStr } from '../lib/validators.ts';

import { requireUser, WithUser } from '../lib/auth.ts';
import dbClient from "../lib/db.ts";
import { PROJECT_STATE, PROJECT_VISIBILITY, PROJECT_TYPE } from '../lib/states.ts';

import type { Project, Update } from "@prisma/client";
import { validateBody, validateParams } from "../lib/middleware/validate.ts";

export type CreateProjectPayload = {
  title: string;
  type: 'words' | 'time' | 'pages' | 'chapters';
  goal: number | null;
  startDate: string | null;
  endDate: string | null;
  visibility: 'public' | 'private';
}

export type CreateUpdatePayload = {
  date: string;
  value: number;
};

export type ProjectResponse = Project & { updates: Update[] };

const projectsRouter = Router();

// GET /projects - return all projects for the user
projectsRouter.get('/',
  requireUser,
  async (req, res: ApiResponse<ProjectResponse[]>, next) =>
{
  let projects: ProjectResponse[];
  try {
    projects = await dbClient.project.findMany({
      where: {
        ownerId: (req as WithUser<Request>).user.id,
        state: PROJECT_STATE.ACTIVE,
      },
      include: {
        updates: true,
      },
    });
  } catch(err) { return next(err); }

  res.status(200).send(success(projects));
});

// GET /projects/:id - return a specific project
projectsRouter.get('/:id',
  requireUser,
  validateParams(z.object({ id: zStrInt() })),
  async (req, res: ApiResponse<ProjectResponse>, next) =>
{
  let project: ProjectResponse | null;
  try {
    project = await dbClient.project.findUnique({
      where: {
        id: +req.params.id,
        ownerId: (req as WithUser<Request>).user.id,
        state: PROJECT_STATE.ACTIVE,
      },
      include: {
        updates: true,
      },
    });
  } catch(err) { return next(err); }

  if(project) {
    res.status(200).send(success(project));
  } else {
    res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }
});

// POST /projects - create a new project
projectsRouter.post('/',
  requireUser,
  validateBody(z.object({
    title: z.string(),
    type: z.enum(Object.values(PROJECT_TYPE) as [string, ...string[]]),
    goal: zInt().nullable(),
    startDate: zDateStr().nullable(),
    endDate: zDateStr().nullable(),
  })),
  async (req, res: ApiResponse<ProjectResponse>, next) =>
{
  let project: ProjectResponse;
  try {
    project = await dbClient.project.create({
      data: {
        ...req.body as CreateProjectPayload,
        state: PROJECT_STATE.ACTIVE,
        visibility: PROJECT_VISIBILITY.PRIVATE,
        starred: false,
        ownerId: (req as WithUser<Request>).user.id
      },
      include: {
        updates: true,
      },
    })
  } catch(err) { return next(err); }

  res.status(201).send(success(project));
});

// POST /projects/:id/update - log an update to a project
projectsRouter.post('/:id/update',
  requireUser,
  validateParams(z.object({ id: zStrInt() })),
  validateBody(z.object({ date: zDateStr(), value: zInt() })),
  async (req, res: ApiResponse<Update>, next) =>
{
  // first, make sure the project exists
  let project: Project | null;
  try {
    project = await dbClient.project.findUnique({
      where: {
        id: +req.params.id,
        ownerId: (req as WithUser<Request>).user.id,
        state: PROJECT_STATE.ACTIVE,
      }
    });
  } catch(err) { return next(err); }

  if(!project) {
    res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
    return;
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
  } catch(err) { return next(err); }

  res.status(201).send(success(update));
});

// // POST /projects/:id - modify the given project
// projectsRouter.post('/:id', async (req, res) => {
//   const db = req.app.get('db') as PrismaClient;

//   // this is, for now, terribly unsafe!
//   // I'll need to do some validation on this before actually deploying it
//   const project = await db.project.update({
//     where: { id: +req.params.id },
//     data: req.body,
//   });

//   res.json(project);
// });

// // DELETE /projects/:id - archive a project
// projectsRouter.delete('/:id', async (req, res) => {
//   const db = req.app.get('db') as PrismaClient;

//   const project = await db.project.update({
//     where: { id: +req.params.id },
//     data: { state: 'archived' },
//     select: { id: true, state: true },
//   });

//   res.status(200).json({ id: project.id, state: project.state });
// });

export default projectsRouter;
