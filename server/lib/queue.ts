import { getNormalizedEnv } from './env.ts';

import Queue from 'better-queue';

import sendSignupEmailTask from './tasks/send-signup-email.ts';
import sendPwchangeEmailTask from './tasks/send-pwchange-email.ts';
import sendPwresetEmailTask from './tasks/send-pwreset-email.ts';
import sendEmailverificationEmailTask from './tasks/send-emailverification-email.ts';
import sendUsernameChangedEmailTask from './tasks/send-username-changed-email.ts';
import sendAccountDeletedEmailTask from './tasks/send-account-deleted-email.ts';
import sendTestEmail from './tasks/send-test-email.ts';

// use the queue log to log info about the queue
import winston from 'winston';

export type HandlerCallback = (error: Error | null, result: unknown) => void;

let q: Queue | null = null;
async function initQueue() {
  const env = await getNormalizedEnv();

  q = new Queue(function(task, cb) {
    taskHandler(task)
      .then(result => cb(null, result))
      .catch(err => cb(err));
  }, {
    store: {
      type: 'sql',
      dialect: 'postgres',
      host: env.DATABASE_HOST,
      port: 5432,
      username: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      dbname: 'queue',
      tableName: 'tasks'
    },
    cancelIfRunning: true,
    autoResume: true,
    batchSize: 1,
    afterProcessDelay: 500, // rate limits on the API limit us to 120 emails/minute = 2 emails/second
    maxRetries: 3,
    retryDelay: 1000, // double the rate limit delay just to be cautious
  });

  // TODO: I don't like this interface/setup. There's gotta be a better way.
  registerTaskType(sendSignupEmailTask);
  registerTaskType(sendPwchangeEmailTask);
  registerTaskType(sendPwresetEmailTask);
  registerTaskType(sendEmailverificationEmailTask);
  registerTaskType(sendUsernameChangedEmailTask);
  registerTaskType(sendAccountDeletedEmailTask);
  registerTaskType(sendTestEmail);

  const queueLogger = winston.loggers.get('queue');
  q.on('task_queued', (taskId, task) => queueLogger.info('Task queued', {taskId, ...task}));
  q.on('task_accepted', (taskId, task) => queueLogger.debug('Task accepted', {taskId, ...task}));
  q.on('task_started', (taskId, task) => queueLogger.info('Task started', {taskId, ...task}));
  q.on('task_finish', (taskId, result) => queueLogger.info('Task finished', {taskId, result}));
  q.on('task_failed', (taskId, err) => queueLogger.warn('Task failed', {taskId, err}));
  // @ts-expect-error this actually does get emitted but the types aren't updated for it
  q.on('task_retry', (taskId, retries) => queueLogger.info('Retrying task', {taskId, retries}));
  q.on('empty', () => queueLogger.debug('Queue is empty but tasks may be in progress'));
  q.on('drain', () => queueLogger.debug('Queue has been drained'));
  q.on('error', (err) => queueLogger.error('Queue experienced an error', { err }));

  winston.info('Queue has been configured');
}

const HANDLER_MAP = {};
function registerTaskType(taskType) {
  HANDLER_MAP[taskType.TASK_NAME] = taskType.handler;
}

async function taskHandler(task) {
  const queueLogger = winston.loggers.get('queue');

  try {
    if(!Object.keys(HANDLER_MAP).includes(task.name)) {
      throw new Error(`No handler found for taskname ${task.name} (task id ${task.id})`);
    }

    return HANDLER_MAP[task.name](task);
  } catch(err) {
    queueLogger.error(err.message);
    throw err;
  }
}

function pushTask(task) {
  if(q === null) { throw new Error('Queue has not been initialized'); }

  const ticket = q.push(task);
  return ticket;
}

export {
  initQueue,
  pushTask
};
