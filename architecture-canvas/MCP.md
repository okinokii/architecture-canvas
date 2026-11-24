# Architecture Canvas как MCP-инструмент

`mcp-server.js` — локальный MCP-сервер на чистом Node.js (без npm-зависимостей), общается по stdio через JSON-RPC 2.0. Он нужен, чтобы ИИ-агент читал, проверял, экспортировал **и создавал** схемы Architecture Canvas, не открывая браузер.

## Подключение

```json
{
  "mcpServers": {
    "architecture-canvas": {
      "command": "node",
      "args": ["C:/Users/daniel/Documents/Проект по умолчанию/architecture-canvas/mcp-server.js"],
      "env": {
        "ARCHCANVAS_MCP_ROOT": "C:/Users/daniel/Documents/Проект по умолчанию",
        "GITHUB_TOKEN": ""
      }
    }
  }
}
```

В этом репозитории сервер уже подключён через [`opencode.json`](../opencode.json) как `architecture-canvas`; дополнительно доступна команда `/architecture-canvas`.

### Безопасность файловых инструментов

- Все пути (`read_schema`, `validate_c4`, `export_mermaid`, `build_ai_prompt`, `make_gist_files`, `push_gist`, `import_project`) проверяются относительно `ARCHCANVAS_MCP_ROOT` (по умолчанию — рабочая директория процесса). Символические ссылки и `..` наружу не пропускаются. Для других каталогов задайте `ARCHCANVAS_MCP_ROOT` в конфиге или явно включите `ARCHCANVAS_MCP_ALLOW_EXTERNAL=1`.
- `import_project.output` должен находиться **внутри импортируемого каталога**; существующие файлы не перезаписываются. Для перезаписи нужно `ARCHCANVAS_MCP_ALLOW_OVERWRITE=1`.
- Объём прочитанного текста за один импорт ограничен 8 МБ (до 400 КБ на файл).
- `push_gist` берёт токен **только** из `GITHUB_TOKEN` / `GH_TOKEN`; аргумент `token` игнорируется. Gist по умолчанию приватный; `public: true` требует `ARCHCANVAS_ALLOW_PUBLIC_GIST=1`.
- Названия, подписи и заметки в промптах оборачиваются в `<untrusted_data>` с явным правилом игнорировать инструкции внутри данных. Инструкция заказчика добавляется отдельно. Доска применяет `instruction` из импортированного JSON только после подтверждения пользователя.

## Инструменты

| Инструмент | Аргументы | Что делает |
|---|---|---|
| `build_schema` | `spaces`?, `cubes` (обязательно), `links`?, `notes`?, `instruction`?, `variant`? | **Конструктор схемы для ИИ.** Принимает списки пространств, кубиков и связей, возвращает `schema` (с полем `instruction`), Mermaid, C4-валидацию и готовый промпт. |
| `import_project` | `path` (обязательно), `output`?, `maxFiles`? | **Импорт готового проекта.** Сканирует каталог с кодом и возвращает схему `nodes/edges/zones/notes`, Mermaid, C4-валидацию и доказательства. `output` — только новый файл внутри каталога проекта. |
| `read_schema` | `path` или `schema` | Читает выгруженную с доски схему и возвращает компактный JSON со счётчиками. |
| `validate_c4` | `path` или `schema` | Мягкая C4-валидация: висячие связи, дубли, петли, противоречия типов, циклы, оторванные блоки. |
| `export_mermaid` | `path` / `schema`, `validate`? | Mermaid `flowchart` с опциональной пометкой о валидации. |
| `build_ai_prompt` | `path` / `schema`, `variant` | Промпт `combo` (PNG + Mermaid + JSON), `png`, `mermaid`, `json` или `prose`. |
| `make_gist_files` | `path` / `schema` | Набор файлов для GitHub Gist. |
| `push_gist` | `path` / `schema`, `gistId`?, `public`? | Создать/обновить приватный Gist. Токен только из `GITHUB_TOKEN`; аргумент `token` больше не принимается. |
| `list_presets` | `category`? (`architecture` / `process`) | Список из 31 пресета с категориями, тегами и счётчиками (включая карту приложения и её процессы). |
| `get_preset` | `id` | Полное описание пресета + JSON-схема + валидация. |
| `preset_export` | `id`, `format`, `variant` | Экспорт пресета в `schema` / `mermaid` / `prompt` / `gist` / `all`. |

## Как ИИ собирает схему по описанию

Вызвать `build_schema` со списками элементов и инструкцией заказчика:

```json
{
  "spaces": [{ "title": "ПЛАТЁЖНЫЙ КОНТУР" }],
  "cubes": [
    { "id": "api", "label": "Order API", "description": "Node.js", "type": "service", "zone": "ПЛАТЁЖНЫЙ КОНТУР" },
    { "id": "bus", "label": "Kafka", "description": "события", "type": "queue", "zone": "ПЛАТЁЖНЫЙ КОНТУР" }
  ],
  "links": [{ "from": "api", "to": "bus", "label": "order.created", "kind": "event" }],
  "notes": ["Заголовок: Кастомная схема", "Легенда: EVT — событие"],
  "instruction": "Проверь отказоустойчивость и предложи улучшения с приоритетами P0/P1/P2."
}
```

Ответ содержит `schema` (поле `instruction` сохраняется), `mermaid`, `validation` и `prompt` с этой инструкцией в конце. Готовую `schema` можно загрузить на доску кнопкой «📂 Импорт».

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
- исходные модули по каталогам `src/<модуль>/` (до 14 крупнейших), связи между ними по `import` / `require` / Python `from … import`;
- `docker-compose.yml`: сервисы, образы, `depends_on`, порты;
- заметки «Заголовок», «Легенда», команды, точки входа и порты.

Типы связей: `sync` (импорт/вызов), `data` (БД, кэш, хранилище), `event` (брокеры), `dependency` (порядок запуска контейнеров).

### Ограничения

Это **статический анализ**, а не исполнение программы. Схема может содержать лишние или пропущенные связи — агент должен показать результат пользователю и предложить уточнить его вручную на доске. Приоритет при передаче модели: `JSON > Mermaid > PNG`.

## Типовые запросы агенту

- «Нарисуй архитектуру проекта в `../simple-service` и импортируй её в доску» → `import_project` → записать `output` → открыть `index.html` → «📂 Импорт».
- «Проверь схему из `architecture-schema.json` перед коммитом» → `validate_c4`.
- «Собери схему из моих блоков и связей и подготовь запрос к ИИ» → `build_schema` со списками `spaces` / `cubes` / `links` и текстом `instruction`.
- «Сделай промпт для Qwen по текущему проекту» → `build_ai_prompt` с `variant: "combo"`.
- «Покажи, как выглядит микросервисная архитектура» → `list_presets` с `category: "architecture"` → `preset_export` с `format: "all"`.
- «Нарисуй диаграмму: пришло сообщение, обработчик среагировал в CRM, результат ушёл пользователю» → `list_presets` с `category: "process"` → `get_preset` для `flow-message` → `preset_export`. Другие готовые процессы: `flow-webhook`, `flow-saga`, `flow-outbox`, `flow-retry-dlq`, `flow-incident`, `flow-cicd`, `flow-cron`.
