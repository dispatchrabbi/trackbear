import type { User, PendingEmailVerification } from 'generated/prisma/client';
import dbClient from '../lib/db.ts';
import winston from 'winston';
import { USER_STATE } from '../lib/models/user/consts.ts';
import { AUDIT_EVENT_SOURCE } from 'server/lib/models/audit-event/consts.ts';
import { TRACKBEAR_SYSTEM_ID, logAuditEvent } from '../lib/audit-events.ts';

type UserWithVerifications = User & { pendingEmailVerifications: PendingEmailVerification[] };

const NAME = 'suspendUnverifiedUsersWorker';

// run once a day at 02:24 (hour and minute chosen at random)
const CRONTAB = '24 2 * * *';

async function run() {
  const workerLogger = winston.loggers.get('worker');
  workerLogger.debug(`Worker has started`, { service: NAME });

  let users: UserWithVerifications[] | null;
  try {
    users = await dbClient.user.findMany({
      where: {
        state: USER_STATE.ACTIVE,
        isEmailVerified: false,
      },
      include: {
        pendingEmailVerifications: { orderBy: { expiresAt: 'desc' } },
      },
    });
  } catch (err) {
    workerLogger.error(`Error while fetching users with pending email verifications: ${err.message}`, { service: NAME });
    return;
  }
  workerLogger.debug(`Found ${users.length} unverified users`, { service: NAME });
  if(users.length === 0) {
    workerLogger.info(`No unverified users found`, { service: NAME });
    return;
  }

  const now = new Date();
  const userIdsToSuspend = users
    .filter(user => user.pendingEmailVerifications.every(v => v.expiresAt <= now))
    .map(user => user.id);
  workerLogger.info(`About to suspend ${userIdsToSuspend.length} users for unverified emails: ${userIdsToSuspend.join(', ')}`);

  try {
    await dbClient.user.updateMany({
      data: {
        state: USER_STATE.SUSPENDED,
      },
      where: {
        id: { in: userIdsToSuspend },
      },
    });

    await Promise.all(userIdsToSuspend.map(id => logAuditEvent('user:suspend', TRACKBEAR_SYSTEM_ID, id, null, { source: AUDIT_EVENT_SOURCE.WORKER, workerName: NAME })));
  } catch (err) {
    workerLogger.error(`Error while suspending users with expired email verifications: ${err.message}`, { service: NAME });
    return;
  }

  workerLogger.info(`Suspended ${userIdsToSuspend.length} users for having unverified emails`, { service: NAME });
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
