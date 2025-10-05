import { getDbClient } from 'server/lib/db.ts';
import { type AdminPerms } from 'generated/prisma/client';

import { RecordNotFoundError } from '../errors.ts';

import { traced } from '../../metrics/tracer.ts';
import { USER_STATE } from '../user/consts.ts';

export type { AdminPerms };

export class AdminPermsModel {
  @traced
  static async getAdminPerms(userId: number): Promise<AdminPerms> {
    const db = getDbClient();
    const adminPerms = await db.adminPerms.findUnique({
      where: {
        userId,
        user: { state: USER_STATE.ACTIVE },
      },
    });

    if(!adminPerms) {
      throw new RecordNotFoundError('adminPerms', userId);
    }

    return adminPerms;
  }
}
