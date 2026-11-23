import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

// Узел «Kafka» из пресета: брокер с топиками и журналом событий.
export function createBroker() {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);
  const log = [];

  return {
    publish(type, payload) {
      const event = { id: randomUUID(), type, payload: payload || {}, publishedAt: new Date().toISOString() };
      log.push(event);
      // Асинхронная доставка — как в реальном брокере.
      setImmediate(() => emitter.emit(type, event));
      return event;
    },
    subscribe(type, handler) {
      emitter.on(type, handler);
    },
    log() { return [...log]; }
  };
}
