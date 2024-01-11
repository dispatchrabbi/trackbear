import path from 'path';
import winston, { format, transports } from 'winston';
import { getNormalizedEnv } from './env.ts';

async function initLoggers(logDir: string) {
  winston.configure({
    level: 'info',
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
      new transports.File({ filename: path.join(logDir, 'trackbear.log') }), // log everything
      new transports.File({ filename: path.join(logDir, 'errors.log'), level: 'error' }), // log errors and up
    ],
    exceptionHandlers: [
      new transports.File({ filename: path.join(logDir, 'exceptions.log') }), // handle uncaught exceptions
    ],
    rejectionHandlers: [
      new transports.File({ filename: path.join(logDir, 'rejections.log') }), // handle uncaught promise rejections
    ],
    exitOnError: false,
  });

  // also log to the console if we're in development mode
  const env = await getNormalizedEnv();
  if (env.NODE_ENV !== 'production') {
    winston.add(new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }));
  }

  winston.loggers.add('access', {
    level: 'info',
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
      new transports.File({ filename: path.join(logDir, 'access.log') }), // log everything
    ],
    exitOnError: false,
  });

  winston.loggers.add('queue', {
    level: 'info',
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
      new transports.File({ filename: path.join(logDir, 'queue.log') }), // log everything
    ],
    exitOnError: false,
  });
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
