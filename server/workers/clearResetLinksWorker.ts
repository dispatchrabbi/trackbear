import { Prisma } from '@prisma/client';
import dbClient from '../lib/db.ts';
import winston from 'winston';
import { PASSWORD_RESET_LINK_STATE } from '../lib/models/user/consts.ts';

const NAME = 'clearResetLinksWorker';

// run every hour at *:08 (minute chosen at random)
const CRONTAB = '8 * * * *';

async function run() {
  const workerLogger = winston.loggers.get('worker');
  workerLogger.debug(`Worker has started`, { service: NAME });

  let deleted: Prisma.BatchPayload | null;
  try {
    deleted = await dbClient.passwordResetLink.deleteMany({
      where: {
        OR: [
          { state: PASSWORD_RESET_LINK_STATE.USED },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });
  } catch (err) {
    workerLogger.error(`Error while deleting password reset links: ${err.message}`, { service: NAME });
    return;
  }

  workerLogger.info(`Deleted ${deleted.count} password reset links`, { service: NAME });
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
