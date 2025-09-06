import type { User } from 'generated/prisma/client';
import type { Request, Response, NextFunction } from 'express';

import dbClient from '../db.ts';
import { failure, FAILURE_CODES } from '../api-response.ts';
import { ACCESS_TYPE, AccessType, AUTHORIZATION_SCHEME } from '../auth-consts.ts';
import { deserializeUser, getApiTokenFromRequest, getUserFromApiToken } from '../auth.ts';
import { ApiKeyModel } from '../models/api-key/api-key-model.ts';

type SessionWithAuth = { session: { auth?: null | { id: number } } };
type RequestWithSessionAuth = Request & SessionWithAuth;
export type WithSessionAuth<R> = R & SessionWithAuth;

interface UserProp {
  user: User;
  accessType: AccessType;
};
export type RequestWithUser = RequestWithSessionAuth & UserProp;

export async function requirePublic(req: Request, res: Response, next: NextFunction) {
  next();
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiToken = getApiTokenFromRequest(req);
  if(!apiToken) {
    return mustIncludeBearerToken(res);
  }

  const user = await getUserFromApiToken(apiToken);
  if(!user) {
    return mustIncludeBearerToken(res);
  }

  setUserOnRequest(req, user, ACCESS_TYPE.API_TOKEN);
  await ApiKeyModel.touchApiKey(apiToken);

  next();
}

export async function requireSession(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
  if(!req.session.auth) {
    return mustBeLoggedIn(res);
  }

  const user = await deserializeUser(req.session.auth.id);
  if(!user) {
    return mustBeLoggedIn(res);
  }

  setUserOnRequest(req, user, ACCESS_TYPE.LOGIN);
  next();
}

export async function requireUser(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
  let user: User | null = null;
  let accessType: AccessType = ACCESS_TYPE.NONE;
  const apiToken = getApiTokenFromRequest(req);

  if(apiToken) {
    // if an API token in the headers exists, use it
    user = await getUserFromApiToken(apiToken);
    accessType = ACCESS_TYPE.API_TOKEN;
  } else if(req.session.auth) {
    // if not, check for an existing session
    user = await deserializeUser(req.session.auth.id);
    accessType = ACCESS_TYPE.LOGIN;
  }

  // if there's no valid token and no existing session, return 403, no api key
  if(!user) {
    return mustIncludeBearerToken(res);
  }

  // otherwise, record the user and get on with it
  setUserOnRequest(req, user, accessType);
  if(apiToken) {
    await ApiKeyModel.touchApiKey(apiToken);
  }

  next();
}

export async function requireAdminUser(req: WithSessionAuth<Request>, res: Response, next: NextFunction) {
  if(!req.session.auth) {
    return mustBeLoggedIn(res);
  }

  const user = await deserializeUser(req.session.auth.id);
  if(!user) {
    return mustBeLoggedIn(res);
  }
  setUserOnRequest(req, user, ACCESS_TYPE.LOGIN);

  const adminPerms = await dbClient.adminPerms.findUnique({ where: { userId: user.id } });
  // don't leak info about whether they even ever have been an admin
  if(!adminPerms || !adminPerms.isAdmin) {
    return forbidden(res);
  }

  next();
}

export async function requirePrivate(req: Request, res: Response) {
  return forbidden(res);
}

function setUserOnRequest(req: Request, user: User, accessType: AccessType) {
  (req as RequestWithUser).user = user;
  (req as RequestWithUser).accessType = accessType;
}

function forbidden(res: Response) {
  return res
    .status(403)
    .send(failure(FAILURE_CODES.FORBIDDEN, `Forbidden`));
}

function mustIncludeBearerToken(res: Response) {
  return res
    .status(401)
    .header('WWW-Authenticate', AUTHORIZATION_SCHEME)
    .send(failure(FAILURE_CODES.NO_API_TOKEN, `No valid API token found in Authorization header`));
}

function mustBeLoggedIn(res: Response) {
  return res
    .status(401)
    .header('WWW-Authenticate', 'Login path="/login"')
    .send(failure(FAILURE_CODES.NOT_LOGGED_IN, `Must be logged in`));
}
