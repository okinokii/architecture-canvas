# Событийно-ориентированный сервис — по пресету `event-driven`

Источник — `schema.json` из Architecture Canvas.

| Узел пресета | Реализация |
|---|---|
| `api` — Command API | `POST /events` в `src/http.js` |
| `producer` — Event Producer | `broker.publish()` в `src/broker.js` |
| `broker` — Kafka | in-process `EventBroker` с асинхронной доставкой (`setImmediate`) |
| `audit` — Audit Consumer | `src/consumers.js` → `GET /audit` |
| `notify` — Notify Consumer | `src/consumers.js` → `GET /notifications` |
| `projector` — Projection Worker | `src/consumers.js` → `GET /projections` |
| `logdb` — Event Log | `broker.log()` → `GET /events` |
| `readdb` — Read Model DB | `stores.projections` (Map) |
| пунктирные ребра | асинхронная публикация/подписка |

Запуск: `npm start` (порт 3102). Тесты: `npm test`.

```powershell
curl -X POST http://localhost:3102/events -H "Content-Type: application/json" -d '{"type":"order.created","payload":{"orderId":"o-1","amount":100}}'
curl http://localhost:3102/projections
```
