import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/auth.ts';

import winston from "winston";

import { z } from 'zod';
import { USERNAME_REGEX } from "../../lib/models/user.ts";
import { validateParams } from "../../lib/middleware/validate.ts";

import { getUserProfile, PublicProfile } from "../../lib/models/profile.ts";
export type { PublicProfile };

const profileRouter = Router();
export default profileRouter;

// GET /:username - get the public profile for a user, assuming one exists
const zUsernameParam = z.object({
  username: z.string().regex(USERNAME_REGEX, { message: 'username given is not a valid username'}),
});
profileRouter.get('/:username',
  validateParams(zUsernameParam),
  h(async (req: RequestWithUser, res: ApiResponse<PublicProfile>) =>
{
  const profile = await getUserProfile(req.params.username);
  if(!profile) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a profile with username ${req.params.username}`));
  }

  return res.status(200).send(success(profile));
}));