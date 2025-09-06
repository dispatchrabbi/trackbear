import * as logger from '../logger';
import { vi } from 'vitest';

const initLoggersMock = vi.spyOn(logger, 'initLoggers').mockImplementation(async () => void 0);
const getLoggerMock = vi.spyOn(logger, 'getLogger').mockImplementation(() => ({
  error: () => void 0,
  warn: () => void 0,
  info: () => void 0,
  debug: () => void 0,
}));
const closeLoggersMock = vi.spyOn(logger, 'closeLoggers').mockImplementation(async () => [void 0]);

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
