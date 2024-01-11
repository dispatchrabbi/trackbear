import Queue from 'better-queue';
import SqliteStore from 'better-queue-sqlite';

import sendSignupEmailTask from './tasks/send-signup-email.ts';
import sendPwchangeEmailTask from './tasks/send-pwchange-email.ts';
import sendPwresetEmailTask from './tasks/send-pwreset-email.ts';

// use the queue log to log info about the queue
import winston from 'winston';

export type HandlerCallback = (error: Error | null, result: unknown) => void;

let q: Queue | null = null;
function initQueue(taskDbPath) {
  q = new Queue(function(task, cb) {
    taskHandler(task)
      .then(result => cb(null, result))
      .catch(err => cb(err));
  }, {
    store: new SqliteStore({
      path: taskDbPath
    }),
  });

  // TODO: I don't like this interface/setup. There's gotta be a better way.
  registerTaskType(sendSignupEmailTask);
  registerTaskType(sendPwchangeEmailTask);
  registerTaskType(sendPwresetEmailTask);

  const queueLogger = winston.loggers.get('queue');
  q.on('task_queued', (taskId, task) => queueLogger.info('Task queued', {taskId, ...task}));
  q.on('task_accepted', (taskId, task) => queueLogger.debug('Task accepted', {taskId, ...task}));
  q.on('task_started', (taskId, task) => queueLogger.info('Task started', {taskId, ...task}));
  q.on('task_finish', (taskId, result) => queueLogger.info('Task finished', {taskId, result}));
  q.on('task_failed', (taskId, err) => queueLogger.warning('Task failed', {taskId, err}));
  // @ts-expect-error For some reason, task_retry isn't recognized as a valid event even though it's definitely in the code
  q.on('task_retry', (taskId, retries) => queueLogger.info('Retrying task', {taskId, retries}));
  q.on('empty', () => queueLogger.debug('Queue is empty (but tasks may be in progress'));
  q.on('drain', () => queueLogger.debug('Queue has been drained'));

  winston.info('Queue has been configured');
}

const HANDLER_MAP = {};
function registerTaskType(taskType) {
  HANDLER_MAP[taskType.TASK_NAME] = taskType.handler;
}

async function taskHandler(task) {
  if(!Object.keys(HANDLER_MAP).includes(task.name)) {
    throw new Error(`No handler found for taskname ${task.name} (task id ${task.id})`);
  }

  return HANDLER_MAP[task.name](task);
}

function pushTask(task) {
  if(q === null) { throw new Error('Queue has not been initialized'); }

  q.push(task);
}

export {
  initQueue,
  pushTask
};
