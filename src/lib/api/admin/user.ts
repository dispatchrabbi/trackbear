import { callApiV1, RoundTrip } from "src/lib/api/api.ts";

import type { User as PrismaUser, AuditEvent as PrismaAuditEvent } from "@prisma/client";
import { UserUpdatePayload, UserStatePayload } from "server/api/admin/user.ts";

export type User = RoundTrip<PrismaUser>;
export type AuditEvent = RoundTrip<PrismaAuditEvent>;
export type { UserUpdatePayload, UserStatePayload };
type EmptyObject = Record<string, never>;

const ENDPOINT = '/api/admin/user';

export async function getUsers() {
  return callApiV1<User[]>(ENDPOINT, 'GET');
}

export async function getUser(id: number) {
  return callApiV1<{ user: User; auditEvents: AuditEvent[]; }>(ENDPOINT + `/${id}`, 'GET');
}

export async function updateUser(id: number, data: UserUpdatePayload) {
  return callApiV1<User>(ENDPOINT + `/${id}`, 'PATCH', data);
}

export async function updateUserState(id: number, data: UserStatePayload) {
  return callApiV1<User>(ENDPOINT + `/${id}/state`, 'PATCH', data);
}

export async function sendEmailVerificationEmail(id: number) {
  return callApiV1<EmptyObject>(ENDPOINT + `/${id}/verify-email`, 'POST');
}

export async function sendResetPasswordEmail(id: number) {
  return callApiV1<EmptyObject>(ENDPOINT + `/${id}/reset-password`, 'POST');
}
