import { callApi } from "./api";
import { UserResponse } from '../../../server/api/auth.ts';

async function logIn(username: string, password: string): Promise<UserResponse> {
  const response = await callApi<UserResponse>('/api/auth/login', 'POST', { username, password });

  if(response.success) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function logOut() {
  const response = await callApi('/api/auth/logout', 'POST');

  if(response.success) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function getUser(): Promise<UserResponse> {
  const response = await callApi<UserResponse>('/api/auth/user');

  if(response.success) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  logIn,
  logOut,
  getUser,
}
