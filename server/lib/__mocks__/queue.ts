import * as _queue from '../queue';
import { vi, afterEach } from 'vitest';

const initQueueMock = vi.spyOn(_queue, 'initQueue').mockResolvedValue(void 0);
// TODO: this should return a ticket, actually
const pushTaskMock = vi.spyOn(_queue, 'pushTask').mockResolvedValue(void 0);

afterEach(() => {
  initQueueMock.mockReset();
  pushTaskMock.mockReset();
});

const initQueue = initQueueMock;
const pushTask = pushTaskMock;

export {
  initQueue,
  pushTask,
};
