import { callApi } from '../../api.ts';
import type { AdminPerms } from 'generated/prisma/client';

export type { AdminPerms };

export async function getMyAdminPerms() {
  const response = await callApi<AdminPerms>('/api/admin/me/perms', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}
