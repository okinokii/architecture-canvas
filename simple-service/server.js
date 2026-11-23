import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Реализация строго по schema.json, снятой с доски:
// u3 "In-memory store" -> Map<id, item>
export function createStore() {
  return new Map();
}

function send(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error('payload too large');
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

// u2 "Item API" — Node.js HTTP сервис
export function createServer(store = createStore()) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);

      // Заметка со схемы: GET /health
      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { status: 'ok', uptime: process.uptime(), items: store.size });
      }

      // Ребро u1 -> u2: GET/POST /items
      if (url.pathname === '/items' && req.method === 'GET') {
        return send(res, 200, { items: [...store.values()] });
      }
      if (url.pathname === '/items' && req.method === 'POST') {
        const input = await readJson(req);
        if (typeof input.name !== 'string' || !input.name.trim()) {
          return send(res, 400, { error: 'field "name" is required' });
        }
        const item = { id: randomUUID(), name: input.name.trim(), createdAt: new Date().toISOString() };
        store.set(item.id, item); // ребро u2 -> u3: CRUD
        return send(res, 201, item);
      }

      // Ребро u2 -> u3: CRUD (READ / UPDATE / DELETE)
      if (parts[0] === 'items' && parts[1]) {
        const id = parts[1];
        const item = store.get(id);
        if (!item) return send(res, 404, { error: 'item not found' });
        if (req.method === 'GET') return send(res, 200, item);
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const patch = await readJson(req);
          if (patch.name !== undefined && (typeof patch.name !== 'string' || !patch.name.trim())) {
            return send(res, 400, { error: 'field "name" must be a non-empty string' });
          }
          const updated = { ...item, ...patch, id, updatedAt: new Date().toISOString() };
          store.set(id, updated);
          return send(res, 200, updated);
        }
        if (req.method === 'DELETE') {
          store.delete(id);
          return send(res, 204);
        }
      }

      return send(res, 404, { error: 'not found' });
    } catch (err) {
      const status = err instanceof SyntaxError ? 400 : 500;
      return send(res, status, { error: status === 400 ? 'invalid JSON' : 'internal error' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();
  server.listen(port, () => console.log(`Item API слушает http://localhost:${port}`));
}
