import { callApiV1, RoundTrip } from "src/lib/api";

import type { User as PrismaUser, AuditEvent as PrismaAuditEvent } from "@prisma/client";
import { UserUpdatePayload, UserStatePayload, UserQuery, GetUsersResponsePayload as _GetUsersResponsePayload } from "server/api/admin/user.ts";

export type GetUsersResponsePayload = RoundTrip<_GetUsersResponsePayload>;
export type User = RoundTrip<PrismaUser>;
export type AuditEvent = RoundTrip<PrismaAuditEvent>;
export type { UserUpdatePayload, UserStatePayload };
type EmptyObject = Record<string, never>;

const ENDPOINT = '/api/admin/user';

export async function getUsers(query: UserQuery = null) {
  return callApiV1<GetUsersResponsePayload>(ENDPOINT, 'GET', null, query);
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

export async function verifyEmailByFiat(id: number) {
  return callApiV1<EmptyObject>(ENDPOINT + `/${id}/verify-email-by-fiat`, 'POST');
}

export async function sendEmailVerificationEmail(id: number) {
  return callApiV1<EmptyObject>(ENDPOINT + `/${id}/send-verify-email`, 'POST');
}

export async function sendResetPasswordEmail(id: number) {
  return callApiV1<EmptyObject>(ENDPOINT + `/${id}/send-password-reset-email`, 'POST');
}
