import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { createBroker } from './src/broker.js';
import { registerConsumers } from './src/consumers.js';
import { createHandler } from './src/http.js';

export function createApp() {
  const broker = createBroker();
  const stores = { audit: [], notifications: [], projections: new Map() };
  registerConsumers(broker, stores);
  return { broker, stores, server: http.createServer(createHandler({ broker, stores })) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3102);
  const { server } = createApp();
  server.listen(port, () => console.log(`Event-driven service: http://localhost:${port}`));
}
