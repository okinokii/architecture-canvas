import { randomUUID } from 'node:crypto';

// Узел «Event Store»: источник истины, только append.
export function createEventStore() {
  const events = [];
  return {
    append(type, data, aggregateId) {
      const event = {
        id: randomUUID(),
        aggregateId: aggregateId || randomUUID(),
        type,
        data: { ...data },
        version: events.length + 1,
        at: new Date().toISOString()
      };
      events.push(event);
      return event;
    },
    all() { return [...events]; }
  };
}
