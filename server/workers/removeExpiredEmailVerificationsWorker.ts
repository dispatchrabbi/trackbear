import dbClient from "../lib/db.ts";
import winston from "winston";

const NAME = 'removeExpiredEmailVerificationsWorker';

// run once a day at 02:24 (hour and minute chosen at random)
// const CRONTAB = '24 2 * * *';
const CRONTAB = '45 * * * * *';

async function run() {
  const workerLogger = winston.loggers.get('worker');
  workerLogger.debug(`Worker has started`, { service: NAME });

  try {
    const now = new Date();
    const result = await dbClient.pendingEmailVerification.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    workerLogger.info(`Deleted ${result.count} expired email verification entries`, { service: NAME });
  } catch(err) {
    workerLogger.error(`Error while deleting pending email verifications: ${err.message}`, { service: NAME });
    return;
  }
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
