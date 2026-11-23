// Узел «Read Model DB» + «Query API»: только чтение, никогда не пишет в Event Store.
export function createReadModel() {
  const items = new Map();
  return {
    upsert(item) { items.set(item.id, { ...item }); },
    get(id) { return items.get(id) || null; },
    all() { return [...items.values()]; }
  };
}
