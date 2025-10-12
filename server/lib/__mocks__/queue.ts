import { vi, afterEach } from 'vitest';
import { mockObject } from 'testing-support/util';
import { type Ticket } from 'better-queue';

import * as _queue from '../queue';

const initQueueMock = vi.spyOn(_queue, 'initQueue').mockResolvedValue(void 0);
// TODO: this should return a ticket, actually
const pushTaskMock = vi.spyOn(_queue, 'pushTask').mockResolvedValue(mockObject<Ticket>());

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
