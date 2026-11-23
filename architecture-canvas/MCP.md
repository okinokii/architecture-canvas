# Architecture Canvas как MCP-инструмент

`mcp-server.js` — локальный MCP-сервер на чистом Node.js (без npm-зависимостей), общается по stdio через JSON-RPC 2.0. Он нужен, чтобы ИИ-агент читал, проверял, экспортировал **и создавал** схемы Architecture Canvas, не открывая браузер.

## Подключение

```json
{
  "mcpServers": {
    "architecture-canvas": {
      "command": "node",
      "args": ["C:/Users/daniel/Documents/Проект по умолчанию/architecture-canvas/mcp-server.js"]
    }
  }
}
```

В этом репозитории сервер уже подключён через [`opencode.json`](../opencode.json) как `architecture-canvas`; дополнительно доступна команда `/architecture-canvas`.

## Инструменты

| Инструмент | Аргументы | Что делает |
|---|---|---|
| `import_project` | `path` (обязательно), `output`?, `maxFiles`? | **Импорт готового проекта.** Сканирует каталог с кодом и возвращает схему `nodes/edges/zones/notes`, Mermaid, C4-валидацию и доказательства (список файлов, фреймворков, модулей, сервисов Compose). |
| `read_schema` | `path` или `schema` | Читает выгруженную с доски схему и возвращает компактный JSON со счётчиками. |
| `validate_c4` | `path` или `schema` | Мягкая C4-валидация: висячие связи, дубли, петли, противоречия типов, циклы, оторванные блоки. |
| `export_mermaid` | `path` / `schema`, `validate`? | Mermaid `flowchart` с опциональной пометкой о валидации. |
| `build_ai_prompt` | `path` / `schema`, `variant` | Промпт `combo` (PNG + Mermaid + JSON), `png`, `mermaid`, `json` или `prose`. |
| `make_gist_files` | `path` / `schema` | Набор файлов для GitHub Gist. |
| `push_gist` | `path` / `schema`, `token`?, `gistId`?, `public`? | Создать/обновить Gist (токен из аргумента или `GITHUB_TOKEN`). |
| `list_presets` | `category`? (`architecture` / `process`) | Список из 29 пресетов с категориями, тегами и счётчиками. |
| `get_preset` | `id` | Полное описание пресета + JSON-схема + валидация. |
| `preset_export` | `id`, `format`, `variant` | Экспорт пресета в `schema` / `mermaid` / `prompt` / `gist` / `all`. |

## Как ИИ рисует схему существующего проекта

1. Вызвать `import_project` с путём к каталогу проекта:

```json
{
  "name": "import_project",
  "arguments": {
    "path": "C:/Users/daniel/Documents/Проект по умолчанию/simple-service",
    "output": "C:/Users/daniel/Documents/Проект по умолчанию/architecture-imported.json",
    "maxFiles": 600
  }
}
```

2. Передать пользователю `schema`, `mermaid` и `validation` из ответа. Если указан `output`, сервер сам запишет `architecture-schema.json`, и агент может сразу сказать: откройте доску и нажмите **«📂 Импорт»** на верхней панели.

3. Доска понимает оба формата: обычный JSON со слоем `elements` (сохранённый «💾 Сохранить JSON») и схему MCP с полями `nodes/edges`. Во втором случае `index.html` сам раскладывает блоки по зонам, строит стрелки с типами и добавляет заметки.

### Что распознаёт `import_project`

- уже существующую схему `architecture-schema.json` / `schema.json` в корне проекта — она берётся за основу, если есть;
- `package.json` (в том числе отдельные пакеты монорепозитория): имя, версия, зависимости, команды `npm run`;
- `requirements*.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle*`, `*.csproj`;
- фреймворки: Next.js, NestJS, Express, Fastify, Vue, React, Django, Flask, FastAPI, Spring, Gin, Laravel;
- инфраструктуру по зависимостям: PostgreSQL, MySQL, MongoDB, Redis, Kafka, RabbitMQ, Elasticsearch, Object Storage (S3), Nginx, gRPC;
- исходные модули по каталогам `src/<модуль>/` (до 14 largest), связи между ними по `import` / `require` / Python `from … import`;
- `docker-compose.yml`: сервисы, образы, `depends_on`, порты;
- заметки «Заголовок», «Легенда», команды, точки входа и порты.

Типы связей: `sync` (импорт/вызов), `data` (БД, кэш, хранилище), `event` (брокеры), `dependency` (порядок запуска контейнеров).

### Ограничения

Это **статический анализ**, а не исполнение программы. Схема может содержать лишние или пропущенные связи — агент должен показать результат пользователю и предложить уточнить его вручную на доске. Приоритет при передаче модели: `JSON > Mermaid > PNG`.

## Типовые запросы агенту

- «Нарисуй архитектуру проекта в `../simple-service` и импортируй её в доску» → `import_project` → записать `output` → открыть `index.html` → «📂 Импорт».
- «Проверь схему из `architecture-schema.json` перед коммитом» → `validate_c4`.
- «Сделай промпт для Qwen по текущему проекту» → `build_ai_prompt` с `variant: "combo"`.
- «Покажи, как выглядит микросервисная архитектура» → `list_presets` с `category: "architecture"` → `preset_export` с `format: "all"`.
- «Нарисуй диаграмму: пришло сообщение, обработчик среагировал в CRM, результат ушёл пользователю» → `list_presets` с `category: "process"` → `get_preset` для `flow-message` → `preset_export`. Другие готовые процессы: `flow-webhook`, `flow-saga`, `flow-outbox`, `flow-retry-dlq`, `flow-incident`, `flow-cicd`, `flow-cron`.
