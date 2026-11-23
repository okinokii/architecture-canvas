import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';

let server, base;

before(async () => {
  server = createServer();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(r => server.close(r)); });

const post = (path, body) => fetch(base + path, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
});

test('health сообщает о слоистом монолите', async () => {
  const res = await fetch(base + '/health');
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.service, 'layered-monolith');
});

test('POST /orders проходит все слои Controller → Service → Repository → Store', async () => {
  const res = await post('/orders', { customer: 'Акме', amount: 1250 });
  assert.equal(res.status, 201);
  const order = await res.json();
  assert.ok(order.id);
  assert.equal(order.customer, 'Акме');
  assert.equal(order.status, 'new');

  const got = await (await fetch(base + '/orders/' + order.id)).json();
  assert.equal(got.amount, 1250);
});

test('GET /orders возвращает список', async () => {
  await post('/orders', { customer: 'Второй', amount: 10 });
  const { orders } = await (await fetch(base + '/orders')).json();
  assert.ok(orders.length >= 2);
});

test('бизнес-правила: запрещённый переход статуса', async () => {
  const order = await (await post('/orders', { customer: 'Third', amount: 5 })).json();
  const bad = await fetch(base + `/orders/${order.id}/status`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'delivered' })
  });
  assert.equal(bad.status, 409);
  const good = await fetch(base + `/orders/${order.id}/status`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'paid' })
  });
  assert.equal(good.status, 200);
  assert.equal((await good.json()).status, 'paid');
});

test('валидация в Service', async () => {
  assert.equal((await post('/orders', { customer: '', amount: 1 })).status, 400);
  assert.equal((await post('/orders', { customer: 'X', amount: -1 })).status, 400);
});
