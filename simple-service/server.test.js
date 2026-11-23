import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createStore } from './server.js';

let server;
let base;

before(async () => {
  server = createServer(createStore());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('GET /health соответствует заметке на схеме', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

test('POST /items создаёт запись в In-memory store', async () => {
  const res = await fetch(`${base}/items`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'первый item' })
  });
  assert.equal(res.status, 201);
  const item = await res.json();
  assert.ok(item.id);
  assert.equal(item.name, 'первый item');
});

test('GET /items возвращает созданные записи', async () => {
  const res = await fetch(`${base}/items`);
  const { items } = await res.json();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, 'первый item');
});

test('CRUD: чтение, обновление и удаление по id', async () => {
  const created = await (await fetch(`${base}/items`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'второй item' })
  })).json();

  const got = await fetch(`${base}/items/${created.id}`);
  assert.equal(got.status, 200);
  assert.equal((await got.json()).name, 'второй item');

  const updated = await fetch(`${base}/items/${created.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'обновлённый item' })
  });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).name, 'обновлённый item');

  const deleted = await fetch(`${base}/items/${created.id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 204);
  assert.equal((await fetch(`${base}/items/${created.id}`)).status, 404);
});

test('валидация пустого name', async () => {
  const res = await fetch(`${base}/items`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '' })
  });
  assert.equal(res.status, 400);
});
