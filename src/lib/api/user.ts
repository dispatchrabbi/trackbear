import { callApi } from "./api.ts";
import { User } from "@prisma/client";

export async function getMe() {
  const response = await callApi<User>('/api/user/me', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}
