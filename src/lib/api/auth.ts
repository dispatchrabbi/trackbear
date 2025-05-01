import { RoundTrip, callApi } from '../api.ts';
import { CreateUserPayload } from 'server/api/auth.ts';

import type { User as PrismaUser } from '@prisma/client';
export type User = RoundTrip<PrismaUser>;

type EmptyObject = Record<string, never>;

async function signUp(userInfo: CreateUserPayload): Promise<User> {
  const response = await callApi<User>('/api/auth/signup', 'POST', userInfo);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function logIn(username: string, password: string): Promise<User> {
  const response = await callApi<User>('/api/auth/login', 'POST', { username, password });

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function logOut(): Promise<void> {
  await callApi('/api/auth/logout', 'POST');
}

async function resendVerifyEmail(): Promise<EmptyObject> {
  const response = await callApi<EmptyObject>(`/api/auth/verify-email`, 'POST');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function verifyEmail(verifyUuid: string): Promise<EmptyObject> {
  const response = await callApi<EmptyObject>(`/api/auth/verify-email/${verifyUuid}`, 'POST');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function changePassword(currentPassword: string, newPassword: string): Promise<EmptyObject> {
  const response = await callApi<EmptyObject>('/api/auth/password', 'POST', { currentPassword, newPassword });

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function requestPasswordReset(username: string): Promise<EmptyObject> {
  const response = await callApi<EmptyObject>('/api/auth/reset-password', 'POST', { username });

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function resetPassword(passwordResetUuid: string, newPassword: string): Promise<EmptyObject> {
  const response = await callApi<EmptyObject>(`/api/auth/reset-password/${passwordResetUuid}`, 'POST', { newPassword });

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  signUp,
  logIn,
  logOut,
  resendVerifyEmail,
  verifyEmail,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
