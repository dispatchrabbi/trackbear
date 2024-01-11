import { CronJob } from 'cron';
import winston from 'winston';

import clearResetLinksWorker from '../workers/clearResetLinksWorker.ts';

const WORKERS = [
  clearResetLinksWorker,
];

function initWorkers() {
  for(const worker of WORKERS) {
    new CronJob(worker.crontab, () => { worker.runFn(); }, null, true);
    winston.debug(`Worker ${worker.name} has been registered`);
  }

  winston.info('Workers have been initialized');
}

export default initWorkers;
