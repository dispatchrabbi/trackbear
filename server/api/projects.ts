import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const projectsRouter = Router();

// GET /projects - return all projects for the user
projectsRouter.get('/', async (req, res) => {
  const db = req.app.get('db') as PrismaClient;

  const projects = await db.project.findMany({
    where: { state: 'active '},
    select: { id: true, uuid: true, title: true, type: true, state: true, starred: true }
  });
  res.status(200).json(projects);
});

// GET /projects/:id - return a specific project
projectsRouter.get('/:id', async (req, res) => {
  const db = req.app.get('db') as PrismaClient;

  const project = await db.project.findUnique({
    where: { id: +req.params.id },
  });
  res.status(200).json(project);
});

// PUT /projects - create a new project
projectsRouter.put('/', (req, res) => {

});

// POST /projects:id - modify the given project
projectsRouter.post('/:id', async (req, res) => {
  const db = req.app.get('db') as PrismaClient;

  // this is, for now, terribly unsafe!
  // I'll need to do some validation on this before actually deploying it
  const project = await db.project.update({
    where: { id: +req.params.id },
    data: req.body,
  });

  res.json(project);
});

// DELETE /projects/:id - archive a project
projectsRouter.delete('/:id', async (req, res) => {
  const db = req.app.get('db') as PrismaClient;

  const project = await db.project.update({
    where: { id: +req.params.id },
    data: { state: 'archived' },
    select: { id: true, state: true },
  });

  res.status(200).json({ id: project.id, state: project.state });
});
