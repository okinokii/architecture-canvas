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

const command = body => fetch(base + '/commands', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
});

test('команда пишется в Event Store, read model обновляется асинхронно', async () => {
  const res = await command({ type: 'createItem', name: 'Первый товар' });
  assert.equal(res.status, 202);
  const result = await res.json();
  assert.ok(result.aggregateId && result.eventId);
  assert.equal(app.eventStore.all().length, 1);

  const item = await waitFor(() => app.readModel.get(result.aggregateId));
  assert.equal(item.name, 'Первый товар');
  assert.equal(item.version, 1);
});

test('Query API читает только read model', async () => {
  await command({ type: 'createItem', name: 'Второй товар' });
  await waitFor(() => app.readModel.all().length === 2);
  const { items } = await (await fetch(base + '/items')).json();
  assert.equal(items.length, 2);
  const id = items[0].id;
  assert.equal((await (await fetch(base + '/items/' + id)).json()).id, id);
  assert.equal((await fetch(base + '/items/missing')).status, 404);
});

test('журнал событий — источник истины', async () => {
  const { events } = await (await fetch(base + '/events')).json();
  assert.equal(events.length, 2);
  assert.ok(events.every(e => e.type === 'item.created' && e.data.name && e.at));
});

test('валидация команд', async () => {
  assert.equal((await command({ type: 'unknown' })).status, 400);
  assert.equal((await command({ type: 'createItem', name: '' })).status, 400);
});
