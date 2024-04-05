import { Router, Request } from "express";
import { ApiResponse, /*failure,*/ success } from '../lib/api-response.ts';

// import { z } from 'zod';

// import dbClient from "../lib/db.ts";
import type { User } from "@prisma/client";

// import { validateBody } from "../lib/middleware/validate.ts";
// import { logAuditEvent } from '../lib/audit-events.ts';
import { requireUser, WithUser } from "../lib/auth.ts";
import { USERNAME_REGEX } from "../lib/models/user.ts";

export type EditUserPayload = Pick<User, 'username' | 'displayName'>;
// const editUserSchema = z.object({
//   username: z.string().min(3).max(24).regex(USERNAME_REGEX),
//   displayName: z.string().min(3).max(24),
// });

const userRouter = Router();

// GET /user/me - get your own user information
userRouter.get('/me',
  requireUser,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: WithUser<Request>, res: ApiResponse<User>, next) =>
{
  return res.status(200).send(success(req.user));
});

// POST /user/me - modify your own user information
// userRouter.post('/me',
//   requireUser,
//   validateBody(editUserBioSchema),
//   async (req: WithUser<Request>, res: ApiResponse<UserBio>, next) =>
// {
//   // ensure this username doesn't already exist
//   const existingUserWithThisUsername = await dbClient.user.findUnique({
//     where: { username: req.body.username }
//   });
//   if(existingUserWithThisUsername) {
//     return res.status(409).send(failure('USERNAME_EXISTS', 'A user with that username already exists.'));
//   }

//   try {
//     const oldUserBio = {
//       username: req.user.username,
//       displayName: req.user.displayName,
//     };

//     req.user = await dbClient.user.update({
//       data: {
//         username: req.body.username,
//         displayName: req.body.displayName,
//       },
//       where: {
//         id: req.user.id,
//       }
//     });

//     await logAuditEvent('user:editbio', req.user.id, req.user.id, null, {
//       username: [ oldUserBio.username, req.user.username ],
//       displayName: [ oldUserBio.displayName, req.user.displayName ],
//     });
//   } catch(err) { return next(err); }

//   const userBio: UserBio = {
//     username: req.user.username,
//     displayName: req.user.displayName,
//   }
//   return res.status(200).send(success(userBio));
// });

export default userRouter;
