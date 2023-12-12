import { Router } from "express";
import { User } from "@prisma/client";

const userRouter = Router();

userRouter.get('/whoami', (req, res) => {
  if(!req.user) {
    res.status(400).send('You need to log in first.');
    return;
  }

  const { id, uuid, email, username, displayName, password, state, createdAt, updatedAt } = req.user as User;

  res.status(200).send({ id, uuid, email, username, displayName, password, state, createdAt, updatedAt });
});

export default userRouter;
