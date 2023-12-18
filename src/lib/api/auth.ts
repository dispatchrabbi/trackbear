import { callApi } from "./api";
import { CreateUserPayload, UserResponse } from '../../../server/api/auth.ts';

async function signUp(userInfo: CreateUserPayload): Promise<number> {
  const response = await callApi('/api/auth/signup', 'POST', userInfo);

  return response.status;
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

export {
  signUp,
  logIn,
  logOut,
  getUser,
}
