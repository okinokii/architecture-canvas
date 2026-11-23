# Architecture Canvas

Офлайн-редактор архитектурных схем: рисуем систему на холсте → выгружаем PNG / Mermaid / JSON / промпт → по этой же схеме реализуем рабочий сервис. Проект не имеет внешних npm-зависимостей: доска — обычный `index.html` на чистом JavaScript, сервисы и MCP-сервер — Node.js из стандартной библиотеки.

## Возможности

- **Рисование**: блоки-метки (пять типов), фигуры вокруг блоков (`F`), карандаш, линии, стрелки, прямоугольники, эллипсы, текст, заметки, зоны. Undo/redo, pan/zoom, автосохранение и версии.
- **Экспорт**: PNG, Mermaid `flowchart`, JSON, пять вариантов промпта для AI (`combo`, `png`, `mermaid`, `json`, `prose`) и «Пакет» — всё сразу. Приоритет данных при передаче модели: `JSON > Mermaid > изображение`.
- **Пресеты**: 7 классических архитектур (слоистый монолит, MVC, микросервисы, event-driven, CQRS, гексагональная, serverless) с зонами, связями и C4-валидацией.
- **Сквозной тест**: по нарисованной схеме реализации `simple-service`, а по пресетам — три сервиса в `preset-services`.
- **Интеграции**: GitHub Gist, OpenAI-совместимый AI API, MCP-сервер с 9 инструментами.
- **Диктовка**: Web Speech API, 18 языков, кнопки в редакторе блока и горячие клавиши.
- **Планшеты и S Pen**: адаптивная раскладка, жесты двумя пальцами, palm rejection, нажим и наклон пера, боковая кнопка и ластик S Pen.

## Структура

```text
.
├── architecture-canvas/     # сама доска и инструменты выгрузки
│   ├── index.html           # редактор (открывается прямо из файла)
│   ├── core.js              # Mermaid, C4-валидация, промпты, Gist
│   ├── presets.js           # 7 архитектурных пресетов
│   ├── mcp-server.js        # MCP-сервер на stdio JSON-RPC
│   └── mcp-config.example.json
├── simple-service/          # Item API по нарисованной вручную схеме
├── preset-services/         # layered-monolith, event-driven, cqrs
├── reports/                 # сравнение с аналогами на GitHub
└── README.md
```

## Быстрый старт

Откройте `architecture-canvas/index.html` в Chrome или Edge — внешние зависимости не нужны. Для стабильной работы с localStorage и файлами можно поднять любой статический сервер, например:

```powershell
cd architecture-canvas
python -m http.server 8080
# http://localhost:8080
```

Горячие клавиши: `V` выбор · `P` карандаш · `L` линия · `A` стрелка · `R` прямоугольник · `E` эллипс · `T` текст · `N` заметка · `F` фигура · `H`/пробел панорама · `D` ластик · `Ctrl+Z`/`Ctrl+Y` · `Ctrl+S` PNG · `Ctrl+M` диктовать название · `Ctrl+Shift+M` описание.

Подробности — в [`architecture-canvas/README.md`](architecture-canvas/README.md).

## Пресеты и реализации

| Пресет | Реализация | Суть | Тесты |
|---|---|---|---|
| `layered` | [`preset-services/layered-monolith`](preset-services/layered-monolith) | Controller → Service → Repository → in-memory Store | 5/5 |
| `event-driven` | [`preset-services/event-driven`](preset-services/event-driven) | брокер, три consumer-а, журнал событий, read model | 6/6 |
| `cqrs` | [`preset-services/cqrs`](preset-services/cqrs) | Command API → Event Store → Bus → Projector → Query API | 4/4 |
| `mvc`, `microservices`, `hexagonal`, `serverless` | — | доступны на доске и через MCP, готовы к генерации кода | — |

Каждый сервис запускается командой `npm start` (порты 3101/3102/3103) и проверяется `npm test`. Данные в `schema.json` сгенерированы из соответствующего пресета.

Отдельно [`simple-service`](simple-service) — Item API, реализованный по схеме, нарисованной вручную в самом первом сквозном тесте (5/5).

## MCP-сервер

`mcp-server.js` — минимальный сервер на чистом Node.js (stdio JSON-RPC, без npm-зависимостей). Инструменты:

`read_schema`, `validate_c4`, `export_mermaid`, `build_ai_prompt`, `make_gist_files`, `push_gist`, `list_presets`, `get_preset`, `preset_export`.

Пример подключения — [`mcp-config.example.json`](architecture-canvas/mcp-config.example.json). Для `push_gist` нужен `GITHUB_TOKEN` с правом `gist`.

## Проверка

```powershell
node --check architecture-canvas/core.js
node --check architecture-canvas/presets.js
node --check architecture-canvas/mcp-server.js
npm test --prefix simple-service
npm test --prefix preset-services/layered-monolith
npm test --prefix preset-services/event-driven
npm test --prefix preset-services/cqrs
```

Итого 20 автотестов, все проходят. Доска дополнительно проверялась в headless Chrome через CDP: экспорт JSON/Mermaid, C4-валидация, пресеты, диктовка с моком Web Speech API, а также сенсорные жесты и эмуляция S Pen.

## Лицензия

MIT — см. [LICENSE](LICENSE).
