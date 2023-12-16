import { createLogger, format, transports } from 'winston';

const logger = createLogger({
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
    new transports.File({ filename: 'logs/trackbear.log' }), // log everything
    new transports.File({ filename: 'logs/trackbear-errors.log', level: 'error' }), // log errors and up
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/trackbear-exceptions.log' }), // handle uncaught exceptions
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/trackbear-rejections.log' }), // handle uncaught promise rejections
  ],
  exitOnError: false,
});

// also log to the console if we're in development mode
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

const accessLogger = createLogger({
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
    new transports.File({ filename: 'logs/trackbear-access.log' }), // log everything
  ],
  exitOnError: false,
});

export default logger;
export {
  accessLogger,
};
