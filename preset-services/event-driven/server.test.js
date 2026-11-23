import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './server.js';

let app, base;

before(async () => {
  app = createApp();
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${app.server.address().port}`;
});
after(async () => { await new Promise(r => app.server.close(r)); });

async function waitFor(fn, timeout = 1500) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = fn();
    if (value) return value;
    await new Promise(r => setTimeout(r, 5));
  }
  throw new Error('условие не выполнено за ' + timeout + ' мс');
}

const publish = payload => fetch(base + '/events', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ type: 'order.created', payload })
});

test('доставка событий асинхронна', async () => {
  const isolated = createApp(); // отдельный брокер, чтобы не влиять на счётчики основных тестов
  isolated.broker.publish('order.created', { orderId: 'isolated' });
  assert.equal(isolated.stores.audit.length, 0, 'событие ещё не доставлено в этом тике');
  await waitFor(() => isolated.stores.audit.length === 1);
  assert.equal(isolated.stores.audit[0].eventId, isolated.broker.log()[0].id);
});

test('POST /events возвращает 202 и событие попадает в аудит', async () => {
  const res = await publish({ orderId: 'o-1', customer: 'Акме', amount: 100 });
  assert.equal(res.status, 202);
  const body = await res.json();
  assert.equal(body.status, 'accepted');
  await waitFor(() => app.stores.audit.length === 1);
  assert.equal(app.stores.audit[0].eventId, body.id);
});

test('три consumer-а обработали одно событие', async () => {
  await publish({ orderId: 'o-2', customer: 'Бета', amount: 250 });
  await waitFor(() => app.stores.projections.has('o-2')
    && app.stores.notifications.some(x => x.message.includes('o-2')));
  assert.ok(app.stores.notifications.some(x => /250|о-2/.test(x.message)));
  assert.equal(app.stores.projections.get('o-2').amount, 250);
});

test('журнал событий доступен через /events', async () => {
  const { events } = await (await fetch(base + '/events')).json();
  assert.equal(events.length, 2);
  assert.ok(events.every(e => e.type === 'order.created' && e.id && e.publishedAt));
});

test('read model и аудит доступны через HTTP', async () => {
  const { items } = await (await fetch(base + '/projections')).json();
  const { records } = await (await fetch(base + '/audit')).json();
  assert.equal(items.length, 2);
  assert.equal(records.length, 2);
});

test('неизвестный тип события отвергается', async () => {
  const res = await fetch(base + '/events', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'unknown' })
  });
  assert.equal(res.status, 400);
});
