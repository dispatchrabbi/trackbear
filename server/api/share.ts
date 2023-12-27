import { Router, Request } from "express";
import { ApiResponse, success, failure } from '../lib/api-response.ts';

import { z } from 'zod';

import dbClient from "../lib/db.ts";
import type { Project, Update } from "@prisma/client";
import type { ProjectWithUpdates } from './projects.ts';
import { PROJECT_STATE, PROJECT_VISIBILITY } from '../lib/states.ts';

import { validateParams } from "../lib/middleware/validate.ts";

type PrivateProjectKeys = "id" | "ownerId" | "state" | "visibility" | "starred" | "createdAt" | "updatedAt";
type SharedProject = Omit<Project, PrivateProjectKeys>;

type PrivateUpdateKeys = "id" | "projectId" | "createdAt" | "updatedAt";
export type SharedUpdate = Omit<Update, PrivateUpdateKeys>;

export type SharedProjectWithUpdates = SharedProject & { updates: SharedUpdate[] };

const shareRouter = Router();

// GET /share/projects/:uuid - return a specific project
shareRouter.get('/projects/:uuid',
  validateParams(z.object({ uuid: z.string().uuid() })),
  async (req: Request, res: ApiResponse<SharedProjectWithUpdates>, next) =>
{
  let fullProject: ProjectWithUpdates | null;
  try {
    fullProject = await dbClient.project.findUnique({
      where: {
        uuid: req.params.uuid,
        state: PROJECT_STATE.ACTIVE,
        visibility: PROJECT_VISIBILITY.PUBLIC,
      },
      include: {
        updates: true,
      },
    });
  } catch(err) { return next(err); }

  if(fullProject) {
    const shareableProject: SharedProjectWithUpdates = {
      uuid: fullProject.uuid,
      title: fullProject.title,
      type: fullProject.type,
      goal: fullProject.goal,
      startDate: fullProject.startDate,
      endDate: fullProject.endDate,
      updates: fullProject.updates.map(update => ({
        date: update.date,
        value: update.value,
      })),
    };

    res.status(200).send(success(shareableProject));
  } else {
    res.status(404).send(failure('NOT_FOUND', `Did not find any project with uuid ${req.params.uuid}.`));
  }
});

export default shareRouter;
