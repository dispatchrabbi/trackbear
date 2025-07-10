import { promisify } from 'node:util';
import type { User } from '@prisma/client';
import type { Request } from 'express';

import dbClient from './db.ts';
import { USER_STATE } from './models/user/consts.ts';
import { UserModel } from './models/user/user-model.ts';

type SessionWithAuth = { session: { auth?: null | { id: number } } };
export type WithSessionAuth<R> = R & SessionWithAuth;

function serializeUser(user: User) {
  return { id: user.id };
}

export async function deserializeUser(id: number) {
  // user might be null here, and that's ok
  const user = await UserModel.getUser(id, { state: USER_STATE.ACTIVE });
  return user;
}

export function logIn(req: WithSessionAuth<Request>, user: User): void {
  req.session.auth = serializeUser(user);
}

function _logOut(req: WithSessionAuth<Request>, cb: (err: unknown) => void): void {
  req.session.destroy(cb);
}
export const logOut = promisify(_logOut);

export const API_TOKEN_HEADER = 'x-api-token';
export function getApiTokenFromRequest(req: Request): string | null {
  const apiToken = req.header(API_TOKEN_HEADER);
  return apiToken ?? null;
}

export async function getUserFromApiToken(apiToken: string) {
  const user = UserModel.getUserByApiToken(apiToken);
  return user;
}
