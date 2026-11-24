# Architecture Canvas

Офлайн-редактор архитектурных схем: рисуем систему, проверяем связи, выгружаем PNG / Mermaid / JSON / запрос для ИИ. Чистый HTML + JavaScript, без npm-зависимостей.

**Где взять:**

- [Открыть онлайн](https://okinokii.github.io/architecture-canvas/) — установка не нужна.
- [Скачать офлайн-архив](https://github.com/okinokii/architecture-canvas/releases/latest) — `ArchitectureCanvas-standalone-*.zip`: распаковать и открыть `index.html`.
- [Скачать APK](https://github.com/okinokii/architecture-canvas/releases/latest) — `ArchitectureCanvas-v*.apk` для Android-планшета.
- [Исходный код](https://github.com/okinokii/architecture-canvas).

## Запуск

**Онлайн:** перейдите по ссылке выше и работайте в браузере. Автосохранение — в локальном хранилище браузера.

**Локально без интернета:** скачайте standalone ZIP из релиза, распакуйте, откройте `index.html` в Chrome или Edge двойным кликом. В архиве уже есть `index.html`, `core.js`, `presets.js`, `START.txt` и `LICENSE`.

**На планшете:** скачайте единственный APK из релиза и откройте его для установки. Обновление — просто установите новый APK поверх прежнего.

**Из исходников:** откройте `architecture-canvas/index.html` в браузере. Если автосохранение работает нестабильно, поднимите статический сервер:

```powershell
cd architecture-canvas
python -m http.server 8080   # http://localhost:8080
```

## Первые шаги

1. Перетащите блок с панели на холст (инструмент при этом не меняется) или выберите тип блока и кликните по холсту. Двойной клик по блоку — название, описание, размер.
2. Нарисуйте стрелку инструментом `A`; двойной клик по ней задаёт подпись и тип: `SYNC`, `ASYNC`, `DATA`, `AUTH`, `EVT`, `DEP`.
3. Для готовой структуры откройте **«Пресеты»** — 31 схема, включая карту этого приложения. **«Конструктор»** собирает схему из пространств, кубиков и связей.
4. Нажмите **«Проверить схему»**: отчёт покажет висячие концы, петли, дубли и циклы.
5. В меню **«Экспорт»** сохраните PNG, JSON, Mermaid или запрос для ИИ. В Qwen прикрепите PNG и вставьте запрос.

Меню сверху: `Файл` (JSON, версии), `Правка` (undo/redo, копирование), `Вид`, `Вставка`, `Схема` (пресеты, проверка), `Экспорт`, `AI`, `Справка` (инструкция и ссылки). Горячие клавиши: `V P L A R E T N F H`, `Ctrl+Z/Y`, `Ctrl+X/C/V/D`, `Ctrl+S` (PNG), `Ctrl+M` (диктовка).

## Что внутри

| Путь | Назначение |
|---|---|
| `architecture-canvas/` | доска (`index.html`), общая логика, пресеты и MCP-сервер |
| `standalone/START.txt` | короткая инструкция внутри офлайн-архива |
| `scripts/make-standalone.ps1` | собрать тот же архив локально |
| `android/` | WebView-обёртка и исходники APK |
| `simple-service/`, `preset-services/` | сервисы, реализованные по схемам; тесты |
| `architecture-canvas/MCP.md` | каталог MCP-инструментов |

Подробное описание доски — [architecture-canvas/README.md](architecture-canvas/README.md), APK — [android/README.md](android/README.md).

## Для агентов

`opencode.json` подключает MCP-сервер `architecture-canvas` (11 инструментов); команда `/architecture-canvas` описана в [`.opencode/commands/architecture-canvas.md`](.opencode/commands/architecture-canvas.md). Пример конфигурации с путями и токеном — [`mcp-config.example.json`](architecture-canvas/mcp-config.example.json).

## Проверка

```powershell
node --check architecture-canvas/core.js
node --check architecture-canvas/presets.js
node --check architecture-canvas/mcp-server.js
npm test --prefix simple-service
npm test --prefix preset-services/layered-monolith
npm test --prefix preset-services/event-driven
npm test --prefix preset-services/cqrs
powershell -ExecutionPolicy Bypass -File scripts/make-standalone.ps1
```

Лицензия: [MIT](LICENSE).
