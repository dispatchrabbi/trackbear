import path from 'path';
import winston, { format, transports } from 'winston';
import { getNormalizedEnv } from 'server/lib/env.ts';

export type LoggerInitOpts = {
  forceConsoles?: boolean
};

async function initLoggers({ forceConsoles = false }: LoggerInitOpts = { }) {
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
       // log everything
      new transports.File({
        filename: path.join(env.LOG_PATH, 'trackbear.log'),
      }),
      // log errors and up
      new transports.File({
        filename: path.join(env.LOG_PATH, 'errors.log'),
        level: 'error'
      }),
      // always log to the console
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    ],
    exceptionHandlers: [
      // handle uncaught exceptions
      new transports.File({
        filename: path.join(env.LOG_PATH, 'exceptions.log'),
      }),
    ],
    rejectionHandlers: [
       // handle uncaught promise rejections
      new transports.File({
        filename: path.join(env.LOG_PATH, 'rejections.log'),
      }),
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
      new transports.File({
        filename: path.join(env.LOG_PATH, 'access.log'),
      }),
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
       // log everything
      new transports.File({
        filename: path.join(env.LOG_PATH, 'queue.log')
      }),
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
       // log everything
      new transports.File({
        filename: path.join(env.LOG_PATH, 'worker.log')
      }),
    ],
    exitOnError: false,
  });

  // also log queue and worker to the console if we're in development mode
  if (forceConsoles || env.NODE_ENV === 'production') {
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

  // if we're testing, don't log anything
  if(env.NODE_ENV === 'testing') {
    winston.loggers.loggers.forEach(logger => {
      logger.silent = true;
    });
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
