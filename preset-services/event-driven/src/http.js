export function createHandler({ broker, stores }) {
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
      if (url.pathname === '/health' && req.method === 'GET') {
        return send(200, {
          status: 'ok', service: 'event-driven',
          events: broker.log().length,
          audit: stores.audit.length,
          notifications: stores.notifications.length,
          projections: stores.projections.size
        });
      }
      if (url.pathname === '/events' && req.method === 'GET') return send(200, { events: broker.log() });
      if (url.pathname === '/audit' && req.method === 'GET') return send(200, { records: stores.audit });
      if (url.pathname === '/notifications' && req.method === 'GET') return send(200, { notifications: stores.notifications });
      if (url.pathname === '/projections' && req.method === 'GET') return send(200, { items: [...stores.projections.values()] });
      if (url.pathname === '/events' && req.method === 'POST') {
        const body = await readBody();
        if (body.type !== 'order.created') return send(400, { error: 'unknown event type' });
        const event = broker.publish(body.type, body.payload);
        return send(202, { id: event.id, status: 'accepted' });
      }
      return send(404, { error: 'not found' });
    } catch (err) {
      if (err instanceof SyntaxError) return send(400, { error: 'invalid JSON' });
      return send(500, { error: err.message || 'internal error' });
    }
  };
}
