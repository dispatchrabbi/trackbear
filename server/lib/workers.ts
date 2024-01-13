import { CronJob } from 'cron';
import winston from 'winston';

// import checkUnverifiedEmailsWorker from '../workers/checkUnverifiedEmailsWorker.ts';
import clearResetLinksWorker from '../workers/clearResetLinksWorker.ts';
import removeExpiredEmailVerificationsWorker from '../workers/removeExpiredEmailVerificationsWorker.ts';

const WORKERS = [
  // TODO: reinstate this after sending out initial verification emails
  // checkUnverifiedEmailsWorker,
  clearResetLinksWorker,
  removeExpiredEmailVerificationsWorker,
];

function initWorkers() {
  for(const worker of WORKERS) {
    new CronJob(worker.crontab, () => { worker.runFn(); }, null, true);
    winston.debug(`Worker ${worker.name} has been registered`);
  }

  winston.info('Workers have been initialized');
}

export default initWorkers;
