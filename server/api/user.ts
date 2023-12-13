import { Router } from "express";
import { RequestWithUser, requireUser } from "../lib/auth.ts";

const userRouter = Router();

userRouter.get('/whoami', requireUser, (req, res) => {
  const { uuid, email, username, displayName, createdAt, updatedAt } = (req as RequestWithUser<typeof req>).user;

  res.status(200).send({ uuid, email, username, displayName, createdAt, updatedAt });
});

export default userRouter;
