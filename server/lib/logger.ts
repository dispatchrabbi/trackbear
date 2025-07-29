import path from 'path';
import winston, { format, transports, type Logger } from 'winston';
import { getNormalizedEnv } from 'server/lib/env.ts';

export type LoggerInitOpts = {
  forceConsoles?: boolean;
};

const loggers: {
  default: Logger;
  access: Logger;
  queue: Logger;
  worker: Logger;
} = {
  default: null,
  access: null,
  queue: null,
  worker: null,
};

const loggerProxies = Object.keys(loggers).reduce((obj, key) => {
  obj[key] = new Proxy({}, {
    get: (target, prop) => {
      if(loggers[key] === null) {
        throw new Error(`Asked for the ${key} logger but loggers have not yet been initialized!`);
      }

      return Reflect.get(loggers[key], prop);
    },
  });

  return obj;
}, {});

export async function initLoggers({ forceConsoles = false }: LoggerInitOpts = { }) {
  const env = await getNormalizedEnv();

  loggers.default = winston.createLogger({
    level: env.LOG_LEVEL,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
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
        level: 'error',
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

  loggers.access = winston.createLogger({
    level: 'info', // not affected by LOG_LEVEL because it's just logging requests
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    defaultMeta: { service: 'trackbear' },
    transports: [
      new transports.File({
        filename: path.join(env.LOG_PATH, 'access.log'),
      }),
    ],
    exitOnError: false,
  });

  loggers.queue = winston.createLogger({
    level: env.LOG_LEVEL,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    defaultMeta: { service: 'queue' },
    transports: [
      // log everything
      new transports.File({
        filename: path.join(env.LOG_PATH, 'queue.log'),
      }),
    ],
    exitOnError: false,
  });

  loggers.worker = winston.createLogger({
    level: env.LOG_LEVEL,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    defaultMeta: { service: 'worker' },
    transports: [
      // log everything
      new transports.File({
        filename: path.join(env.LOG_PATH, 'worker.log'),
      }),
    ],
    exitOnError: false,
  });

  // also log queue and worker to the console if we're in development mode
  if(forceConsoles || env.NODE_ENV === 'production') {
    loggers.queue.add(new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
      ),
    }));

    loggers.worker.add(new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
      ),
    }));
  }

  // if we're testing, don't log anything
  if(env.NODE_ENV === 'testing') {
    for(const logger of Object.values(loggers)) {
      logger.silent = true;
    };
  }
}

export function getLogger(logName: keyof typeof loggers = 'default') {
  return loggerProxies[logName];
}

export async function closeLoggers() {
  return Promise.all(Object.values(loggers).map(logger => {
    return new Promise<void>((res/* , rej */) => {
      logger.on('finish', () => res());
      logger.end();
    });
  }));
}
