# CQRS + Event Sourcing — реализация по пресету `cqrs`

Источник — `schema.json` из Architecture Canvas.

| Узел пресета | Реализация |
|---|---|
| `client` — Client | HTTP-клиент / `fetch` |
| `cmdapi` — Command API | `POST /commands` в `src/http.js` |
| `handler` — Command Handler | `src/commandHandler.js` |
| `eventstore` — Event Store | `src/eventStore.js` (append-only) |
| `bus` — Event Bus | `src/bus.js` (асинхронная доставка) |
| `projector` — Projector | `src/projector.js` |
| `readdb` — Read Model DB | `src/readModel.js` |
| `queryapi` — Query API | `GET /items`, `GET /items/:id` |
| ребра `publish` / `subscribe` | пунктирные асинхронные связи пресета |

Запуск: `npm start` (порт 3103). Тесты: `npm test`.

```powershell
curl -X POST http://localhost:3103/commands -H "Content-Type: application/json" -d '{"type":"createItem","name":"Товар"}'
curl http://localhost:3103/items
curl http://localhost:3103/events
```

Read model может отставать от Event Store — это ожидаемое eventual consistency, что и проверяют тесты.
