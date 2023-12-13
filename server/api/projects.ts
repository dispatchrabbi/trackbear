import { Router } from "express";

import { requireUser } from '../lib/auth.ts';
import dbClient from "../lib/db.ts";
import { PROJECT_STATE } from '../lib/states.ts';

import { Project } from "@prisma/client";
import { RequestWithUser } from '../lib/auth.ts';

const projectsRouter = Router();

// GET /projects - return all projects for the user
projectsRouter.get('/', requireUser, async (req, res, next) => {
  let projects: Project[];
  try {
    projects = await dbClient.project.findMany({
      where: {
        ownerId: (req as RequestWithUser<typeof req>).user.id,
        state: PROJECT_STATE.ACTIVE
      }
    });
  } catch(err) { return next(err); }

  res.status(200).send(projects);
});

// GET /projects/:id - return a specific project
projectsRouter.get('/:id', requireUser, async (req, res, next) => {
  // TODO: validate :id
  let project: Project | null;
  try {
    project = await dbClient.project.findUnique({
      where: {
        id: +req.params.id,
        ownerId: (req as RequestWithUser<typeof req>).user.id,
        state: PROJECT_STATE.ACTIVE
      }
    });
  } catch(err) { return next(err); }

  if(project) {
    res.status(200).send(project);
  } else {
    res.status(404).send();
  }
});

// // PUT /projects - create a new project
// projectsRouter.put('/', (req, res) => {

// });

// // POST /projects:id - modify the given project
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
