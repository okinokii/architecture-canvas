import { randomUUID } from 'node:crypto';

// Слой Service: бизнес-правила, никакого HTTP и никакого прямого доступа к БД.
const TRANSITIONS = {
  new: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

export function createOrderService(repository) {
  function create(input) {
    const customer = String(input?.customer || '').trim();
    const amount = Number(input?.amount);
    if (!customer) throw Object.assign(new Error('field "customer" is required'), { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error('field "amount" must be > 0'), { status: 400 });
    return repository.save({
      id: randomUUID(), customer, amount,
      status: 'new', createdAt: new Date().toISOString()
    });
  }

  function get(id) {
    const order = repository.findById(id);
    if (!order) throw Object.assign(new Error('order not found'), { status: 404 });
    return order;
  }

  function list() {
    return repository.findAll();
  }

  function changeStatus(id, next) {
    const order = get(id);
    if (!TRANSITIONS[order.status]?.includes(next)) {
      throw Object.assign(new Error(`transition ${order.status} → ${next} is not allowed`), { status: 409 });
    }
    return repository.save({ ...order, status: next, updatedAt: new Date().toISOString() });
  }

  return { create, get, list, changeStatus, transitions: TRANSITIONS };
}
