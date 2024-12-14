import dbClient from "../db.ts";
import { type AdminPerms } from "@prisma/client";

import { RecordNotFoundError } from "./errors.ts";

import { traced } from "../tracer.ts";

export type { AdminPerms };

export class AdminPermsModel {

  @traced
  static async getAdminPerms(userId: number): Promise<AdminPerms> {
    const adminPerms = await dbClient.adminPerms.findUnique({
      where: { userId },
    });
  
    if(!adminPerms) {
      throw new RecordNotFoundError('adminPerms', userId);
    }
  
    return adminPerms;
  }

}