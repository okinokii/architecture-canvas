# Сервисы, реализованные по пресетам Architecture Canvas

Каждая папка — отдельный Node.js-сервис без внешних зависимостей. `schema.json` сгенерирован из соответствующего пресета (`architecture-canvas/presets.js`) и служит источником истины.

| Папка | Пресет | Идея | Тесты |
|---|---|---|---|
| `layered-monolith` | `layered` | Controller → Service → Repository → Map (вместо PostgreSQL), переходы статусов заказа | 5/5 |
| `event-driven` | `event-driven` | Брокер с асинхронной доставкой, три независимых consumer-а, журнал и read model | 6/6 |
| `cqrs` | `cqrs` | Command API → Event Store → Event Bus → Projector → Read Model → Query API | 4/4 |

Запуск любого: `npm start` (порты 3101/3102/3103, переопределяются `PORT`). Проверка: `npm test`.

Общая особенность: асинхронные ребра пресета (пунктир в Mermaid) реализованы через `setImmediate`, поэтому тесты проверяют eventual consistency, а не мгновенную согласованность.
