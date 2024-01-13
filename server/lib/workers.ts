import { CronJob } from 'cron';
import winston from 'winston';

import clearResetLinksWorker from '../workers/clearResetLinksWorker.ts';
import checkUnverifiedEmailsWorker from '../workers/checkUnverifiedEmailsWorker.ts';

const WORKERS = [
  clearResetLinksWorker,
  // TODO: reinstate this after sending out initial verification emails
  // checkUnverifiedEmailsWorker
];

function initWorkers() {
  for(const worker of WORKERS) {
    new CronJob(worker.crontab, () => { worker.runFn(); }, null, true);
    winston.debug(`Worker ${worker.name} has been registered`);
  }

  winston.info('Workers have been initialized');
}

export default initWorkers;
