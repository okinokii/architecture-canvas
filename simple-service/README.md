# Item API — реализация по рисунку с доски

Источник истины — `schema.json`, выгруженный из Architecture Canvas после рисования.

| Элемент схемы | Что реализовано |
|---|---|
| `u1 Клиент (curl/браузер)` — HTTP + JSON | Любой HTTP-клиент, `Content-Type: application/json` |
| ребро `GET/POST /items` | `GET /items`, `POST /items` |
| `u2 Item API` — Node.js HTTP сервис | `server.js` на встроенном `node:http`, без зависимостей |
| ребро `CRUD` | `GET /items/:id`, `PUT/PATCH /items/:id`, `DELETE /items/:id` |
| `u3 In-memory store` — `Map<id, item>` | `createStore()` — `new Map()` |
| заметка `GET /health, GET /items, POST /items` | Все три эндпоинта присутствуют |

## Запуск

```powershell
npm start
# слушает http://localhost:3000, порт можно переопределить: $env:PORT=4000
```

## Проверка

```powershell
npm test
```

## Примеры запросов

```powershell
curl http://localhost:3000/health
curl -X POST http://localhost:3000/items -H "Content-Type: application/json" -d '{"name":"первый"}'
curl http://localhost:3000/items
```

Хранилище живёт в памяти процесса — это точно соответствует блоку `Map<id, item>` на схеме. После перезапуска данные очищаются.
