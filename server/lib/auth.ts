import type { User } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

import dbClient from './db.ts';
import { failure } from './api-response.ts';
import { USER_STATE } from "./models/user.ts";

type SessionWithAuth = { session: { auth?: null | { id: number } } };
// export type RequestWithSessionAuth = Express.Request & SessionWithAuth;
export type WithSessionAuth<R> = R & SessionWithAuth;

interface UserProp { user: User }
// export type RequestWithUser = RequestWithSessionAuth & UserProp;
export type WithUser<R extends Request> = R & UserProp;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestWithUser = Request & UserProp;

function serializeUser(user: User) {
  return { id: user.id };
}

async function deserializeUser(id: number) {
  // user might be null here, and that's ok
  const user = await dbClient.user.findUnique({ where: {
    id,
    state: USER_STATE.ACTIVE,
  } });
  return user;
}

function logIn(req: WithSessionAuth<Request>, user: User): void {
  req.session.auth = serializeUser(user);
}

function logOut(req: WithSessionAuth<Request>, cb: (err: unknown) => void): void {
  req.session.destroy(cb);
}

async function requireUser(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
  if(!req.session.auth) {
    return res.status(403).send(failure('NOT_LOGGED_IN', 'Must be logged in'));
  }

  const user = await deserializeUser(req.session.auth.id);
  if(!user) {
    return res.status(403).send(failure('NOT_LOGGED_IN', 'Must be logged in'));
  }

  (req as WithUser<Request>).user = user;
  next();
}

async function requireAdminUser(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
  if(!req.session.auth) {
    return res.status(403).send(failure('NOT_LOGGED_IN', 'Must be logged in'));
  }

  const user = await deserializeUser(req.session.auth.id);
  if(!user) {
    return res.status(403).send(failure('NOT_LOGGED_IN', 'Must be logged in'));
  }
  (req as WithUser<Request>).user = user;

  const adminPerms = await dbClient.adminPerms.findUnique({ where: { userId: user.id } });
  // don't leak info about whether they even ever have been an admin
  if(!adminPerms || !adminPerms.isAdmin) {
    return res.status(403).send(failure('FORBIDDEN', 'Forbidden'));
  }

  next();
}

export {
  logIn,
  logOut,
  requireUser,
  requireAdminUser,
};
