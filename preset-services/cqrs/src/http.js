export function createHandler({ handle, eventStore, readModel }) {
  return async function handler(req, res) {
    const send = (status, body) => {
      const payload = body === undefined ? '' : JSON.stringify(body);
      res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': Buffer.byteLength(payload)
      });
      res.end(payload);
    };
    const readBody = async () => {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      return raw ? JSON.parse(raw) : {};
    };

    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);

      if (url.pathname === '/health' && req.method === 'GET') {
        return send(200, {
          status: 'ok', service: 'cqrs',
          events: eventStore.all().length, items: readModel.all().length
        });
      }
      // Command API
      if (url.pathname === '/commands' && req.method === 'POST') {
        return send(202, handle(await readBody()));
      }
      // Query API
      if (url.pathname === '/items' && req.method === 'GET') {
        return send(200, { items: readModel.all() });
      }
      if (parts[0] === 'items' && parts[1] && req.method === 'GET') {
        const item = readModel.get(parts[1]);
        return item ? send(200, item) : send(404, { error: 'item not found' });
      }
      if (url.pathname === '/events' && req.method === 'GET') {
        return send(200, { events: eventStore.all() });
      }
      return send(404, { error: 'not found' });
    } catch (err) {
      if (err instanceof SyntaxError) return send(400, { error: 'invalid JSON' });
      const status = err.status || 500;
      return send(status, { error: err.message || 'internal error' });
    }
  };
}
