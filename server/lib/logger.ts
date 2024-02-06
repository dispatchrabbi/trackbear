import path from 'path';
import winston, { format, transports } from 'winston';
import { getNormalizedEnv } from './env.ts';

async function initLoggers() {
  const env = await getNormalizedEnv();

  winston.configure({
    level: env.LOG_LEVEL,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: 'trackbear' },
    transports: [
      new transports.File({ filename: path.join(env.LOG_PATH, 'trackbear.log') }), // log everything
      new transports.File({ filename: path.join(env.LOG_PATH, 'errors.log'), level: 'error' }), // log errors and up
      new transports.Console({ format: format.combine(format.colorize(), format.simple()) }), // always log to the console
    ],
    exceptionHandlers: [
      new transports.File({ filename: path.join(env.LOG_PATH, 'exceptions.log') }), // handle uncaught exceptions
    ],
    rejectionHandlers: [
      new transports.File({ filename: path.join(env.LOG_PATH, 'rejections.log') }), // handle uncaught promise rejections
    ],
    exitOnError: false,
  });

  winston.loggers.add('access', {
    level: 'info', // not affected by LOG_LEVEL because it's just logging requests
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: 'trackbear' },
    transports: [
      new transports.File({ filename: path.join(env.LOG_PATH, 'access.log') }),
    ],
    exitOnError: false,
  });

  winston.loggers.add('queue', {
    level: env.LOG_LEVEL,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: 'queue' },
    transports: [
      new transports.File({ filename: path.join(env.LOG_PATH, 'queue.log') }), // log everything
    ],
    exitOnError: false,
  });

  winston.loggers.add('worker', {
    level: env.LOG_LEVEL,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: 'worker' },
    transports: [
      new transports.File({ filename: path.join(env.LOG_PATH, 'worker.log') }), // log everything
    ],
    exitOnError: false,
  });

  // also log queue and worker to the console if we're in development mode
  if (env.NODE_ENV !== 'production') {
    winston.loggers.get('queue').add(new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }));

    winston.loggers.get('worker').add(new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }));
  }
}

async function closeLoggers() {
  return Promise.all(Array.from(winston.loggers.loggers.values()).map(logger => {
    return new Promise<void>((res/*, rej*/) => {
      logger.on('finish', () => res());
      logger.end();
    });
  }));
}

export { initLoggers, closeLoggers };
