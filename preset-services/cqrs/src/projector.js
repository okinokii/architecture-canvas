// Projector: строит read model из потока событий.
export function createProjector(bus, readModel) {
  bus.subscribe(event => {
    if (event.type === 'item.created') {
      readModel.upsert({
        id: event.aggregateId,
        name: event.data.name,
        createdAt: event.at,
        version: event.version
      });
    }
  });
}
