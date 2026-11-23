# Слоистый монолит — реализация по пресету `layered`

Источник — `schema.json`, сгенерированный из пресета Architecture Canvas.

| Узел пресета | Реализация |
|---|---|
| `browser` — Браузер | HTTP-клиент (`fetch`/curl) |
| `controller` — Controller | `src/routes.js` |
| `service` — Service | `src/service.js` (бизнес-правила и переходы статусов) |
| `repository` — Repository (DAO/SQL) | `src/repository.js` |
| `postgres` — PostgreSQL | `src/store.js` (`Map` вместо реальной БД) |
| ребро `HTTPS` | `POST /orders` |
| ребро `SQL, транзакция` | вызовы repository из service |

Запуск: `npm start` (порт 3101, переопределяется `PORT`). Тесты: `npm test`.

```powershell
curl -X POST http://localhost:3101/orders -H "Content-Type: application/json" -d '{"customer":"Акме","amount":1250}'
curl http://localhost:3101/orders
```
