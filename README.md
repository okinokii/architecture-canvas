# Architecture Canvas

Офлайн-редактор архитектурных схем: рисуем систему на холсте → выгружаем PNG / Mermaid / JSON / промпт → по этой же схеме реализуем рабочий сервис. Проект не имеет внешних npm-зависимостей: доска — обычный `index.html` на чистом JavaScript, сервисы и MCP-сервер — Node.js из стандартной библиотеки.

**Онлайн-версия (GitHub Pages):** https://okinokii.github.io/architecture-canvas/ — открывается в любом браузере, работает без установки; автосохранение хранится локально в браузере. Для планшета также есть APK из [релизов](https://github.com/okinokii/architecture-canvas/releases).

## Возможности

- **Рисование**: блоки-метки (20 типов: сервисы, БД, кэш, очередь, мониторинг/health-check, демон, worker, планировщик, балансировщик, IAM, аналитика, CI/CD, LLM и др.), фигуры вокруг блоков (`F`), карандаш, линии, стрелки, прямоугольники, эллипсы, текст, заметки, зоны. В правой панели есть «Примеры блоков и событий» — готовые фрагменты с подписанными связями (health-check, демон → очередь → воркер, сообщение → реакция → результат, retry/DLQ, cron, JWT). Блоки заготовки можно перетаскивать — они переносятся в ваш слой со связанными стрелками; при перемещении блока привязанные связи тянутся за ним и не рвутся. Отмена в редакторе ничего не добавляет, после добавления включается «Выбор». Undo/redo, pan/zoom, автосохранение и версии. Импорт JSON и пресеты — на верхней панели; основные инструменты подняты в начало правой панели.
- **Конструктор для ИИ**: кнопка **«🧱 Конструктор»** на верхней панели открывает формы «Пространства / Кубики / Связи / Инструкция для ИИ». Элементы сразу появляются на доске, попадают в JSON/Mermaid и в запрос к модели; можно редактировать и удалять их, а инструкцию заказчика сохранить отдельно (поле `instruction` в схеме).
- **Экспорт**: PNG, Mermaid `flowchart`, JSON, пять вариантов промпта для AI (`combo`, `png`, `mermaid`, `json`, `prose`) и «Пакет» — всё сразу. Приоритет данных при передаче модели: `JSON > Mermaid > изображение`.
- **Пресеты**: 29 вариантов в двух категориях — 21 архитектура (классические и современные, плюс Data Lake, ML-сервинг, RAG-чат, IoT, e-commerce, мультирегион, Strangler, наблюдаемость) и 8 логических/событийных сценариев процессов (сообщение → реакция → результат, платёжный webhook, Saga, outbox, retry/DLQ, инцидент, CI/CD, cron). Открываются кнопкой **«🏛 Пресеты»** на верхней панели, там же есть фильтр по категории.
- **Связи блоков**: шесть типов (`SYNC`, `ASYNC`, `DATA`, `AUTH`, `EVT`, `DEP`), автоматическая привязка концов к блокам, зелёная галочка на корректной связи и красный крестик на висячей. Валидация ловит висячие концы, петли, дубли, противоречия типов и циклы зависимостей.
- **Сквозной тест**: по нарисованной схеме реализации `simple-service`, а по пресетам — три сервиса в `preset-services`.
- **Интеграции**: GitHub Gist, OpenAI-совместимый AI API, MCP-сервер с 11 инструментами (`build_schema` — конструктор схемы по спискам пространств/кубиков/связей, `import_project` — схема по исходникам готового проекта).
- **Диктовка**: Web Speech API, 18 языков, кнопки в редакторе блока и горячие клавиши.
- **Планшеты и S Pen**: адаптивная раскладка, масштабируемый интерфейс (80–180 %, авто под экран), жесты двумя пальцами, palm rejection, нажим и наклон пера, боковая кнопка и ластик S Pen. Готов APK для Galaxy Tab S8 Ultra.

## Структура

```text
.
├── architecture-canvas/     # сама доска и инструменты выгрузки
│   ├── index.html           # редактор (открывается прямо из файла)
│   ├── core.js              # Mermaid, C4-валидация, промпты, Gist
│   ├── presets.js           # 29 пресетов: архитектуры и сценарии процессов
│   ├── project-import.js    # статический импорт готового проекта в схему
│   ├── mcp-server.js        # MCP-сервер на stdio JSON-RPC (11 инструментов)
│   ├── MCP.md               # каталог MCP-инструментов
│   └── mcp-config.example.json
├── simple-service/          # Item API по нарисованной вручную схеме
├── android/                 # WebView-обёртка для APK (сборка в GitHub Actions)
│   └── app/src/main/        # MainActivity, Manifest, ресурсы
├── preset-services/         # layered-monolith, event-driven, cqrs
├── reports/                 # сравнение с аналогами на GitHub
├── opencode.json            # подключение MCP-сервера к OpenCode
├── .opencode/commands/      # команда /architecture-canvas
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

## Связи и целостность схемы

В правой панели есть раздел **«Связи блоков»**:

- выберите тип новой стрелки: `SYNC`, `ASYNC`, `DATA`, `AUTH`, `EVT` или `DEP`; двойной клик по стрелке меняет тип и подпись;
- конец стрелки автоматически прилипает к ближайшему блоку, у корректной связи у начала рисуется зелёная галочка, у висячей — красный крестик, а сама линия красная и пунктирная;
- счётчик под селектором показывает, сколько концов не привязано; кнопка **«Привязать висячие концы»** пытается исправить их автоматически;
- кнопка **«Проверить схему»** теперь ищет не только C4-полноту, но и висячие связи (`DANGLING_EDGE`), петли (`SELF_LOOP`), дубли (`DUPLICATE_EDGE`), несоответствие типа и `async` (`KIND_ASYNC_MISMATCH`), подписи, противоречащие типу (`LABEL_KIND_CONFLICT`), циклы зависимостей (`DEPENDENCY_CYCLE`) и оторванные блоки (`ISOLATED_NODE`).

Тип связи попадает в Mermaid (`|SYNC: HTTPS|`), JSON (`kind`, `fromAttached`, `toAttached`) и промпт для модели.

## Масштаб интерфейса

В разделе **«Масштаб интерфейса»** правой панели: ползунок и кнопки `−/+` меняют размер панелей, кнопок, шрифтов и целей касания в диапазоне **80–180 %**. Это не меняет масштаб схемы. Чекбокс **«Авто под экран»** включён по умолчанию: на сенсорных экранах ≥1200 px размер автоматически увеличивается (Galaxy Tab S8 Ultra — 125 %), а ручная настройка сохраняется в `localStorage` (`archcanvas.uiScale`, `archcanvas.uiAutoScale`).

## APK для Android-планшета

Папка [`android/`](android) содержит минимальный WebView-проект без npm-зависимостей. При сборке файлы доски копируются из `architecture-canvas/`, поэтому исходник остаётся один.

- **Готовый APK**: автоматический выпуск APK приостановлен — сборка больше не запускается на теги и пуш. При необходимости откройте **Actions → Android APK → Run workflow** и скачайте артефакт `architecture-canvas-apk`.
- **Локальная сборка**: нужны JDK 17, Android SDK (platform 35, build-tools 35.0.0) и Gradle 8.11+: `gradle -p android assembleDebug`. APK появится в `android/app/build/outputs/apk/debug/`.
- **Установка**: `adb install android/app/build/outputs/apk/debug/app-debug.apk` или просто откройте APK на планшете. Приложение полноэкранное, использует `file:///android_asset/index.html`, автосохранение работает в WebView.
- S Pen, жесты и масштаб интерфейса в APK работают так же, как в браузере; диктовка зависит от движка WebView и может быть недоступна — используйте Chrome/Edge для неё.

Подробнее — [`android/README.md`](android/README.md).

## Расширение для OpenCode

В корне лежит [`opencode.json`](opencode.json): он подключает тот же MCP-сервер как локальный MCP `architecture-canvas` (11 инструментов). Дополнительно доступна команда **`/architecture-canvas`** ([`.opencode/commands/architecture-canvas.md`](.opencode/commands/architecture-canvas.md)) — она объясняет агенту, как работать с пресетами, схемой и экспортом; подробный каталог инструментов — в [`architecture-canvas/MCP.md`](architecture-canvas/MCP.md). Инструмент `import_project` анализирует готовый репозиторий и возвращает схему, которую доска загружает через «📂 Импорт». Конфигурация подхватывается автоматически, без установки пакетов.

## Пресеты и реализации

| Пресет | Реализация | Суть | Тесты |
|---|---|---|---|
| `layered` | [`preset-services/layered-monolith`](preset-services/layered-monolith) | Controller → Service → Repository → in-memory Store | 5/5 |
| `event-driven` | [`preset-services/event-driven`](preset-services/event-driven) | брокер, три consumer-а, журнал событий, read model | 6/6 |
| `cqrs` | [`preset-services/cqrs`](preset-services/cqrs) | Command API → Event Store → Bus → Projector → Query API | 4/4 |
| `mvc`, `microservices`, `hexagonal`, `serverless` | — | доступны на доске и через MCP, готовы к генерации кода | — |
| `modular-monolith`, `clean`, `bff`, `streaming`, `microfrontend`, `service-mesh` | — | модули, порты, BFF, стриминг, микрофронтенды, mTLS/политики | — |

Каждый сервис запускается командой `npm start` (порты 3101/3102/3103) и проверяется `npm test`. Данные в `schema.json` сгенерированы из соответствующего пресета.

Отдельно [`simple-service`](simple-service) — Item API, реализованный по схеме, нарисованной вручную в самом первом сквозном тесте (5/5).

## MCP-сервер

`mcp-server.js` — минимальный сервер на чистом Node.js (stdio JSON-RPC, без npm-зависимостей). Инструменты:

`build_schema`, `import_project`, `read_schema`, `validate_c4`, `export_mermaid`, `build_ai_prompt`, `make_gist_files`, `push_gist`, `list_presets`, `get_preset`, `preset_export`. Пресеты доступны в категориях `architecture` и `process`; подробности — [`architecture-canvas/MCP.md`](architecture-canvas/MCP.md).

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
