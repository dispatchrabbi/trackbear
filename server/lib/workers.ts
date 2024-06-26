import { CronJob } from 'cron';
import winston from 'winston';

import suspendUnverifiedUsersWorker from 'server/workers/suspendUnverifiedUsersWorker.ts';
import clearResetLinksWorker from 'server/workers/clearResetLinksWorker.ts';
import removeExpiredEmailVerificationsWorker from 'server/workers/removeExpiredEmailVerificationsWorker.ts';

const WORKERS = [
  suspendUnverifiedUsersWorker,
  clearResetLinksWorker,
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
