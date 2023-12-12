import { User } from "@prisma/client";

import dbClient from './db.ts';

type SessionWithAuth = { session: { auth?: null | { id: number } } };
type RequestWithSessionAuth = Express.Request & SessionWithAuth;

type RequestWithUser = Express.Request & { user?: null | User };

function serializeUser(user: User) {
  return { id: user.id };
}

async function deserializeUser(id: number) {
  // user might be null here, and that's ok
  const user = await dbClient.user.findUnique({ where: { id } });
  return user;
}

function logIn(req: RequestWithSessionAuth, user: User): void {
  req.session.auth = serializeUser(user);
}

function logOut(req: RequestWithSessionAuth): void {
  req.session.auth = null;
}

async function requireUser(req, res, next) {
  if(!req.session.auth) {
    return res.status(403).send({ message: 'Must be logged in' });
  }

  const user = await deserializeUser(req.session.auth.id);
  if(!user) {
    return res.status(403).send({ message: 'Must be logged in' });
  }

  req.user = user;
  next();
}

export {
  logIn,
  logOut,
  requireUser,
};

export type { RequestWithUser };
