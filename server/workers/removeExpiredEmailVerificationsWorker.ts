import dbClient from "../lib/db.ts";
import winston from "winston";

const NAME = 'removeExpiredEmailVerificationsWorker';

// run once a day at 02:24 (hour and minute chosen at random)
const CRONTAB = '24 2 * * *';

async function run() {
  const workerLog = winston.loggers.get('worker');
  workerLog.debug(`Worker has started`, { service: NAME });

  try {
    const now = new Date();
    const count = await dbClient.pendingEmailVerification.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    workerLog.info(`Deleted ${count} expired email verification entries`);
  } catch(err) {
    workerLog.error(`Error while deleting pending email verifications: ${err.message}`, { service: NAME });
    return false;
  }
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
