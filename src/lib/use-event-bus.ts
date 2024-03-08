import mitt, { Emitter, EventType, Handler } from 'mitt';
import { onBeforeUnmount } from 'vue';

export interface GlobalEvents extends Record<EventType, unknown> {}

const emitter: Emitter<GlobalEvents> = mitt<GlobalEvents>();

export function useEventBus() {
    const on = function<Key extends keyof GlobalEvents>(type: Key, handler: Handler<GlobalEvents[Key]>): void {
        emitter.on(type, handler);
        onBeforeUnmount(async () => {
            emitter.off(type, handler);
        });
    };

    const off = function<Key extends keyof GlobalEvents>(type: Key, handler: Handler<GlobalEvents[Key]>): void {
      emitter.off(type, handler);
    }

    const emit = function<Key extends keyof GlobalEvents>(type: Key, data: GlobalEvents[Key]): void {
      emitter.emit(type, data);
    }

    return { emit, on, off };
}
