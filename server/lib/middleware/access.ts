import type { User } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

import dbClient from '../db.ts';
import { failure } from '../api-response.ts';
import { deserializeUser } from '../auth.ts';

type SessionWithAuth = { session: { auth?: null | { id: number } } };
type RequestWithSessionAuth = Request & SessionWithAuth;
export type WithSessionAuth<R> = R & SessionWithAuth;

interface UserProp { user: User }
export type RequestWithUser = RequestWithSessionAuth & UserProp;
export type WithUser<R extends Request> = R & UserProp;

export async function requirePublic(req: Request, res: Response, next: NextFunction) {
  next();
}

export async function requireUser(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
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

export async function requireAdminUser(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
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

export async function requirePrivate(req: Request, res: Response) {
  return res.status(403).send(failure('FORBIDDEN', 'Forbidden'));
}
