import { CronJob } from 'cron';
import winston from 'winston';

import clearResetLinksWorker from 'server/workers/clearResetLinksWorker.ts';
import minifyImagesWorker from 'server/workers/minifyImagesWorker.ts';
import removeExpiredEmailVerificationsWorker from 'server/workers/removeExpiredEmailVerificationsWorker.ts';
import suspendUnverifiedUsersWorker from 'server/workers/suspendUnverifiedUsersWorker.ts';

const WORKERS = [
  clearResetLinksWorker,
  minifyImagesWorker,
  suspendUnverifiedUsersWorker,
  removeExpiredEmailVerificationsWorker,
];

function initWorkers() {
  const workerLogger = winston.loggers.get('worker');
  for(const worker of WORKERS) {
    new CronJob(worker.crontab, () => {
      worker.runFn()
        .catch(err => workerLogger.error(`Worker ${worker.name} encountered an error: ${err.message}`, { service: worker.name }));
    }, null, true);
    winston.debug(`Worker ${worker.name} has been registered`);
  }

  winston.info('Workers have been initialized');
}

export default initWorkers;
