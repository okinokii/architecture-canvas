// Слой Repository (DAO / SQL) из пресета — единственный, кто работает с хранилищем.
export function createRepository(store) {
  return {
    save(order) {
      store.set(order.id, { ...order });
      return { ...order };
    },
    findById(id) {
      const order = store.get(id);
      return order ? { ...order } : null;
    },
    findAll() {
      return [...store.values()].map(o => ({ ...o }));
    }
  };
}
