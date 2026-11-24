---
description: Работать с Architecture Canvas через MCP (импорт проекта, пресеты, схема, экспорт, C4)
---

Используй MCP-сервер `architecture-canvas` и его инструменты (`build_schema`, `import_project`, `list_presets`, `get_preset`, `preset_export`, `read_schema`, `validate_c4`, `export_mermaid`, `build_ai_prompt`, `make_gist_files`, `push_gist`) для следующего запроса:

$ARGUMENTS

Правила:
- Если пользователь задаёт свои блоки/пространства/связи или просит подготовить схему под конкретный вопрос к ИИ, вызови `build_schema` с массивами `spaces`, `cubes`, `links` и текстом `instruction` — он попадёт в `schema.instruction` и в промпт. Результат можно загрузить на доску через «📂 Импорт».
- Если пользователь просит нарисовать схему **существующего проекта**, вызови `import_project` с `path` к его каталогу (и `output` для JSON), покажи `schema`, `mermaid` и результат `validation`, затем предложи открыть `architecture-canvas/index.html` и нажать «📂 Импорт».
- Подробное описание инструментов и примеры — в [`architecture-canvas/MCP.md`](architecture-canvas/MCP.md). Пресеты делятся на `architecture` (22) и `process` (9) — для диаграмм «сообщение → реакция → результат» используйте категорию `process`. Пресеты `self-map-architecture` и `self-map-processes` — сверенная с кодом карта самого приложения и его процессы.
- Доска понимает и обычный JSON со слоем `elements`, и схему MCP с `nodes/edges`; приоритет при передаче модели: JSON > Mermaid > PNG.
- Для запроса к AI по умолчанию используй формат `combo` (PNG + Mermaid + JSON), если пользователь не попросил другой.
- Если пользователь хочет открыть доску, предложи открыть `architecture-canvas/index.html` в браузере (или APK/PWA на планшете), но не запускай долгоживущий сервер без необходимости.
- Изменения вносятся в исходники репозитория; после правок запусти релевантные `npm test` и `node --check`.
