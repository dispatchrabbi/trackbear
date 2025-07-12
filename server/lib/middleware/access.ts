import type { User } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

import dbClient from '../db.ts';
import { failure } from '../api-response.ts';
import { API_TOKEN_HEADER } from '../auth-consts.ts';
import { deserializeUser, getApiTokenFromRequest, getUserFromApiToken } from '../auth.ts';

type SessionWithAuth = { session: { auth?: null | { id: number } } };
type RequestWithSessionAuth = Request & SessionWithAuth;
export type WithSessionAuth<R> = R & SessionWithAuth;

interface UserProp { user: User }
export type RequestWithUser = RequestWithSessionAuth & UserProp;
export type WithUser<R extends Request> = R & UserProp;

export async function requirePublic(req: Request, res: Response, next: NextFunction) {
  next();
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = getApiTokenFromRequest(req);
  if(!apiKey) {
    return res.status(403).send(failure('NO_API_TOKEN', `No valid API token found in ${API_TOKEN_HEADER} header`));
  }

  const user = await getUserFromApiToken(apiKey);
  if(!user) {
    return res.status(403).send(failure('NO_API_TOKEN', `No valid API token found in ${API_TOKEN_HEADER} header`));
  }

  setUserOnRequest(req, user);
  next();
}

export async function requireSession(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
  if(!req.session.auth) {
    return res.status(403).send(failure('NOT_LOGGED_IN', 'Must be logged in'));
  }

  const user = await deserializeUser(req.session.auth.id);
  if(!user) {
    return res.status(403).send(failure('NOT_LOGGED_IN', 'Must be logged in'));
  }

  setUserOnRequest(req, user);
  next();
}

export async function requireUser(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
  let user: User;
  const apiToken = getApiTokenFromRequest(req);

  if(apiToken) {
    // if an API token in the headers exists, use it
    user = await getUserFromApiToken(apiToken);
  } else if(req.session.auth) {
    // if not, check for an existing session
    user = await deserializeUser(req.session.auth.id);
  }

  // if there's no valid token and no existing session, return 403, no api key
  if(!user) {
    return res.status(403).send(failure('NO_API_TOKEN', `No valid API token found in ${API_TOKEN_HEADER} header`));
  }

  // otherwise, record the user and get on with it
  setUserOnRequest(req, user);
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
  setUserOnRequest(req, user);

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

function setUserOnRequest(req: Request, user: User) {
  (req as RequestWithUser).user = user;
}
