import type { User, PendingEmailVerification } from "@prisma/client";
import dbClient from "../lib/db.ts";
import winston from "winston";
import { USER_STATE } from "../lib/states.ts";
import { TRACKBEAR_SYSTEM_ID, logAuditEvent } from "../lib/audit-events.ts";

type UserWithVerifications = User & { pendingEmailVerifications: PendingEmailVerification[] }

const NAME = 'checkUnverifiedEmailsWorker';

// run once a day at 01:13 (hour and minute chosen at random)
const CRONTAB = '13 1 * * *';

async function run() {
  const workerLog = winston.loggers.get('worker');
  workerLog.debug(`Worker has started`, { service: NAME });

  let users: UserWithVerifications[] | null;
  try {
    users = await dbClient.user.findMany({
      where: {
        isEmailVerified: false,
      },
      include: {
        pendingEmailVerifications: { orderBy: { expiresAt: 'desc' } },
      },
    });
  } catch(err) {
    workerLog.error(`Error while fetching users with pending email verifications: ${err.message}`, { service: NAME });
    return false;
  }

  const userIdsToSuspend = users
    .filter(user => user.pendingEmailVerifications.length === 0 || user.pendingEmailVerifications[0].expiresAt <= now)
    .map(user => user.id);
  workerLog.info(`About to suspend ${userIdsToSuspend.length} users for unverified emails: ${userIdsToSuspend.join(', ')}`);

  const now = new Date();

  try {
    await dbClient.$transaction([
      dbClient.user.updateMany({
        data: {
          state: USER_STATE.SUSPENDED,
        },
        where: {
          id: { in: userIdsToSuspend },
        },
      }),
      dbClient.pendingEmailVerification.deleteMany({
        where: { userId: { in: userIdsToSuspend } },
      }),
    ]);

    await Promise.all(userIdsToSuspend.map(id => logAuditEvent('user:suspend', TRACKBEAR_SYSTEM_ID, id, null, { reason: `Email was not verified in time (${NAME})` })));
  } catch(err) {
    workerLog.error(`Error while suspending users with expired email verifications: ${err.message}`, { service: NAME });
    return false;
  }
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
