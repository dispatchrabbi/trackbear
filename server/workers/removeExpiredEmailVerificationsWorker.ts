import dbClient from '../lib/db.ts';
import { addDays } from 'date-fns';

import { getLogger } from 'server/lib/logger.ts';
const workerLogger = getLogger('worker');

const NAME = 'removeExpiredEmailVerificationsWorker';

// run once a day at 01:13 (hour and minute chosen at random)
const CRONTAB = '13 1 * * *';

async function run() {
  workerLogger.debug(`Worker has started`, { service: NAME });

  try {
    const now = new Date();
    const result = await dbClient.pendingEmailVerification.deleteMany({
      where: {
        expiresAt: { lt: addDays(now, -7) }, // keep expired verifications an extra 7 days, for troubleshooting
      },
    });

    workerLogger.info(`Deleted ${result.count} expired email verification entries`, { service: NAME });
  } catch (err) {
    workerLogger.error(`Error while deleting pending email verifications: ${err.message}`, { service: NAME });
    return;
  }
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
