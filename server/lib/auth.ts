import { promisify } from 'node:util';
import type { User } from "@prisma/client";
import type { Request } from "express";

import dbClient from './db.ts';
import { USER_STATE } from "./models/user.ts";

type SessionWithAuth = { session: { auth?: null | { id: number } } };
export type WithSessionAuth<R> = R & SessionWithAuth;

function serializeUser(user: User) {
  return { id: user.id };
}

export async function deserializeUser(id: number) {
  // user might be null here, and that's ok
  const user = await dbClient.user.findUnique({ where: {
    id,
    state: USER_STATE.ACTIVE,
  } });
  return user;
}

export function logIn(req: WithSessionAuth<Request>, user: User): void {
  req.session.auth = serializeUser(user);
}

function _logOut(req: WithSessionAuth<Request>, cb: (err: unknown) => void): void {
  req.session.destroy(cb);
}
export const logOut = promisify(_logOut);
