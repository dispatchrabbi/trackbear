import { callApi } from "./api";
import { UserResponse } from '../../../server/api/auth.ts';

async function logIn(username: string, password: string): Promise<UserResponse> {
  return await callApi('/api/auth/login', 'POST', { username, password });
}

async function logOut() {
  return await callApi('/api/auth/logout', 'POST');
}

async function getUser(): Promise<UserResponse> {
  return await callApi('/api/auth/user');
}

export {
  logIn,
  logOut,
  getUser,
}
