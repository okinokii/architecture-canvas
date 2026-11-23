// Узел «Event Bus» из пресета.
export function createBus() {
  const handlers = [];
  return {
    subscribe(handler) { handlers.push(handler); },
    publish(event) {
      // Доставка в следующем тике — read model обновляется асинхронно.
      setImmediate(() => handlers.forEach(h => h(event)));
    }
  };
}
