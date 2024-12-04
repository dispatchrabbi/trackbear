import { Router } from "express";
import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from "server/lib/api.ts";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { USERNAME_REGEX } from "../../lib/models/user.ts";
import { validateParams } from "../../lib/middleware/validate.ts";

import { getUserProfile, PublicProfile } from "../../lib/models/profile.ts";
export type { PublicProfile };

export const profileRouter = Router();

// GET /:username - get the public profile for a user, assuming one exists
const zUsernameParam = z.object({
  username: z.string().regex(USERNAME_REGEX, { message: 'username given is not a valid username'}),
});
profileRouter.get('/:username',
  validateParams(zUsernameParam),
  h(handleGetProfile)
);
export async function handleGetProfile(req: RequestWithUser, res: ApiResponse<PublicProfile>) {
  const profile = await getUserProfile(req.params.username);
  if(!profile) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a profile with username ${req.params.username}`));
  }

  return res.status(200).send(success(profile));
}

const routes: RouteConfig[] = [
  {
    path: '/:username',
    method: HTTP_METHODS.GET,
    handler: handleGetProfile,
    accessLevel: ACCESS_LEVEL.PUBLIC,
    paramsSchema: zUsernameParam,
  },
];

export default routes;