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
      new transports.File({ filename: path.join(logDir, 'trackbear-errors.log'), level: 'error' }), // log errors and up
    ],
    exceptionHandlers: [
      new transports.File({ filename: path.join(logDir, 'trackbear-exceptions.log') }), // handle uncaught exceptions
    ],
    rejectionHandlers: [
      new transports.File({ filename: path.join(logDir, 'trackbear-rejections.log') }), // handle uncaught promise rejections
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
      new transports.File({ filename: path.join(logDir, 'trackbear-access.log') }), // log everything
    ],
    exitOnError: false,
  });
}

export default initLoggers;
