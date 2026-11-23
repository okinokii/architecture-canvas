// Command Handler: проверяет команду, пишет событие в Event Store и публикует его.
export function createCommandHandler(eventStore, bus) {
  return function handle(command) {
    if (!command || command.type !== 'createItem') {
      throw Object.assign(new Error('unknown command'), { status: 400 });
    }
    const name = String(command.name || '').trim();
    if (!name) throw Object.assign(new Error('field "name" is required'), { status: 400 });

    const event = eventStore.append('item.created', { name }, command.aggregateId);
    bus.publish(event);
    return { aggregateId: event.aggregateId, eventId: event.id, version: event.version };
  };
}
