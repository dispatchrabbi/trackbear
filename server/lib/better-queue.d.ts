/* =================== USAGE ===================
    import * as Queue from "better-queue";
    var queue = new Queue(...);
 =============================================== */
// Stolen (and patched) from @types/better-queue
// I will submit a PR to correct the types... at some point.
/* eslint-disable @typescript-eslint/no-explicit-any */

/// <reference types="node" />

import { EventEmitter } from 'events';

declare class BetterQueue<T = any, K = any> extends EventEmitter {
  constructor(options: BetterQueue.QueueOptions<T, K>);
  constructor(process: BetterQueue.ProcessFunction<T, K>, options?: Partial<BetterQueue.QueueOptions<T, K>>);

  push(task: T, cb?: (err: any, result: K) => void): BetterQueue.Ticket;

  cancel(taskId: any, cb?: () => void): void;

  pause(): void;

  resume(): void;

  destroy(cb: () => void): void;

  use(store: BetterQueue.Store<T>): void;

  getStats(): BetterQueue.QueueStats;

  resetStats(): void;

  on(event: 'task_finish', listener: (taskId: any, result: K) => void): this;
  on(event: 'task_failed', listener: (taskId: any, errorMessage: string) => void): this;
  on(event: 'task_progress', listener: (taskId: any, completed: number, total: number) => void): this;
  on(event: 'task_retry', listener: (taskId: any, retries: number) => void): this;
  on(event: BetterQueue.QueueEvent, listener: (...args: any[]) => void): this;
}

declare namespace BetterQueue {
  interface QueueOptions<T, K> {
    process: ProcessFunction<T, K>;
    filter?(task: T, cb: (error: any, task: T) => void): void;
    merge?(oldTask: T, newTask: T, cb: (error: any, mergedTask: T) => void): void;
    priority?(task: T, cb: (error: any, priority: number) => void): void;
    precondition?(cb: (error: any, passOrFail: boolean) => void): void;
    id?: keyof T | ((task: T, cb: (error: any, id: keyof T) => void) => void) | undefined;
    cancelIfRunning?: boolean | undefined;
    autoResume?: boolean | undefined;
    failTaskOnProcessException?: boolean | undefined;
    filo?: boolean | undefined;
    batchSize?: number | undefined;
    batchDelay?: number | undefined;
    batchDelayTimeout?: number | undefined;
    concurrent?: number | undefined;
    maxTimeout?: number | undefined;
    afterProcessDelay?: number | undefined;
    maxRetries?: number | undefined;
    retryDelay?: number | undefined;
    storeMaxRetries?: number | undefined;
    storeRetryTimeout?: number | undefined;
    preconditionRetryTimeout?: number | undefined;
    store?: string | StoreOptions | Store<T> | undefined;
  }

    // TODO reflect task types somehow (task: T | T[])
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    type ProcessFunction<T, K> = (task: any, cb: ProcessFunctionCb<K>) => void;

    type ProcessFunctionCb<K> = (error?: any, result?: K) => void;

    type QueueEvent =
      | 'task_queued'
      | 'task_accepted'
      | 'task_started'
      | 'task_finish'
      | 'task_failed'
      | 'task_progress'
      | 'batch_finish'
      | 'batch_failed'
      | 'batch_progress'
      | 'drain'
      | 'empty'
      | 'error';

    type TicketEvent =
      | 'accept'
      | 'queued'
      | 'started'
      | 'progress'
      | 'finish'
      | 'failed'
      | 'error';

    interface Store<T> {
      connect(cb: (error: any, length: number) => void): void;

      getTask(taskId: any, cb: (error: any, task: T) => void): void;

      deleteTask(taskId: any, cb: () => void): void;

      putTask(taskId: any, task: T, priority: number, cb: (error: any) => void): void;

      takeFirstN(n: number, cb: (error: any, lockId: string) => void): void;

      takeLastN(n: number, cb: (error: any, lockId: string) => void): void;

      getLock(lockId: string, cb: (error: any, tasks: { [taskId: string]: T }) => void): void;

      releaseLock(lockId: string, cb: (error: any) => void): void;
    }

    interface StoreOptions {
      type: string;
      // store-specific options
      [key: string]: any;
    }

    class Ticket extends EventEmitter {
      on(event: TicketEvent, listener: (...args: any[]) => void): this;
    }

    interface TickerProgress {
      eta: string;
      pct: number;
      complete: number;
      total: number;
      message: string;
    }

    interface QueueStats {
      total: number;
      average: number;
      successRate: number;
      peak: number;
    }
}

export = BetterQueue;
