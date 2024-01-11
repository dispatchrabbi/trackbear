import { callApi } from "./api.ts";
import { CreateUserPayload, UserResponse } from 'server/api/auth.ts';

async function signUp(userInfo: CreateUserPayload): Promise<UserResponse> {
  const response = await callApi<UserResponse>('/api/auth/signup', 'POST', userInfo);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function logIn(username: string, password: string): Promise<UserResponse> {
  const response = await callApi<UserResponse>('/api/auth/login', 'POST', { username, password });

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function logOut(): Promise<void> {
  await callApi('/api/auth/logout', 'POST');
}

async function getUser(): Promise<UserResponse> {
  const response = await callApi<UserResponse>('/api/auth/user');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

type EmptyObject = Record<string, never>;
async function changePassword(currentPassword: string, newPassword: string): Promise<EmptyObject> {
  const response = await callApi<EmptyObject>('/api/auth/password', 'POST', { currentPassword, newPassword });

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
  getUser,
  changePassword,
}
