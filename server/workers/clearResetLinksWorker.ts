import { Prisma } from "@prisma/client";
import dbClient from "../lib/db.ts";
import winston from "winston";
import { PASSWORD_RESET_LINK_STATE } from "../lib/states.ts";

const NAME = 'clearResetLinksWorker';

// run every hour at *:08 (minute chosen at random)
const CRONTAB = '8 * * * *';

async function run() {
  const workerLog = winston.loggers.get('worker');
  workerLog.debug(`Worker has started`, { service: NAME });

  let deleted: Prisma.BatchPayload | null;
  try {
    deleted = await dbClient.passwordResetLink.deleteMany({
      where: {
        OR: [
          { state: PASSWORD_RESET_LINK_STATE.USED },
          { expiresAt: { lt: new Date() } }
        ]
      }
    });
  } catch(err) {
    workerLog.error(`Error while running: ${err.message}`, { service: NAME });
    return false;
  }

  // don't clog the logs
  if(deleted.count > 0) {
    workerLog.info(`Deleted ${deleted.count} password reset links`, { service: NAME });
  } else {
    workerLog.debug(`Deleted ${deleted.count} password reset links`, { service: NAME });
  }
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
