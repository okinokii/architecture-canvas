import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { createStore } from './src/store.js';
import { createRepository } from './src/repository.js';
import { createOrderService } from './src/service.js';
import { createHandler } from './src/routes.js';

export function createServer() {
  const store = createStore();
  const repository = createRepository(store);
  const service = createOrderService(repository);
  const handler = createHandler(service);
  return http.createServer(handler);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3101);
  createServer().listen(port, () => console.log(`Layered monolith: http://localhost:${port}`));
}
