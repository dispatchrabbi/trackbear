import { vi } from 'vitest';

import type { Logger } from 'winston';
import * as logger from '../logger';

const initLoggersMock = vi.spyOn(logger, 'initLoggers').mockImplementation(async () => {});
const getLoggerMock = vi.spyOn(logger, 'getLogger').mockImplementation(() => {
  const loggerMock = {
    error: () => loggerMock,
    warn: () => loggerMock,
    info: () => loggerMock,
    debug: () => loggerMock,
  } as unknown as Logger;

  return loggerMock;
});
const closeLoggersMock = vi.spyOn(logger, 'closeLoggers').mockImplementation(async () => Promise.resolve([]));

const initLoggers = initLoggersMock;
const getLogger = getLoggerMock;
const closeLoggers = closeLoggersMock;

export {
  initLoggersMock,
  getLoggerMock,
  closeLoggersMock,
  initLoggers,
  getLogger,
  closeLoggers,
};
