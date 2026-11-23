// Слой Controller из пресета: только HTTP, валидация и вызов сервиса.
export function createHandler(service) {
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
      if (!raw) return {};
      return JSON.parse(raw);
    };

    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);

      if (req.method === 'GET' && url.pathname === '/health') {
        return send(200, { status: 'ok', service: 'layered-monolith', orders: service.list().length });
      }
      if (url.pathname === '/orders' && req.method === 'GET') {
        return send(200, { orders: service.list() });
      }
      if (url.pathname === '/orders' && req.method === 'POST') {
        return send(201, service.create(await readBody()));
      }
      if (parts[0] === 'orders' && parts[1]) {
        if (req.method === 'GET') return send(200, service.get(parts[1]));
        if (req.method === 'PATCH' && parts[2] === 'status') {
          const body = await readBody();
          return send(200, service.changeStatus(parts[1], body.status));
        }
      }
      return send(404, { error: 'not found' });
    } catch (err) {
      if (err instanceof SyntaxError) return send(400, { error: 'invalid JSON' });
      const status = err.status || 500;
      return send(status, { error: err.message || 'internal error' });
    }
  };
}
