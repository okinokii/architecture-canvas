// Три независимых consumer-а из пресета.
export function registerConsumers(broker, stores) {
  broker.subscribe('order.created', event => {
    stores.audit.push({ eventId: event.id, type: event.type, at: new Date().toISOString() });
  });
  broker.subscribe('order.created', event => {
    stores.notifications.push({
      eventId: event.id,
      message: `Новый заказ ${event.payload.orderId || event.id} на сумму ${event.payload.amount ?? '?'}`
    });
  });
  broker.subscribe('order.created', event => {
    stores.projections.set(event.payload.orderId || event.id, {
      orderId: event.payload.orderId || event.id,
      customer: event.payload.customer,
      amount: event.payload.amount,
      updatedAt: event.publishedAt
    });
  });
}
