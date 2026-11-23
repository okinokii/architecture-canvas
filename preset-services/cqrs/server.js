import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { createEventStore } from './src/eventStore.js';
import { createBus } from './src/bus.js';
import { createCommandHandler } from './src/commandHandler.js';
import { createReadModel } from './src/readModel.js';
import { createProjector } from './src/projector.js';
import { createHandler } from './src/http.js';

export function createApp() {
  const eventStore = createEventStore();
  const bus = createBus();
  const readModel = createReadModel();
  const handle = createCommandHandler(eventStore, bus);
  createProjector(bus, readModel);
  return {
    eventStore, readModel, handle,
    server: http.createServer(createHandler({ handle, eventStore, readModel }))
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3103);
  const { server } = createApp();
  server.listen(port, () => console.log(`CQRS service: http://localhost:${port}`));
}
