# APK для Android-планшета

Минимальный Android-проект, который открывает офлайн-доску Architecture Canvas в полноэкранном WebView. Написан на чистом Java + Android SDK, без npm-зависимостей и без proprietary Samsung SDK. S Pen работает через стандартные Pointer Events.

## Что внутри

```text
android/
├── app/
│   ├── build.gradle               # AGP, compileSdk 35, копирование веб-ассетов
│   └── src/main/
│       ├── AndroidManifest.xml    # полноэкранная Activity, иконка launcher
│       ├── java/.../MainActivity.java
│       ├── res/                   # имя, тема, иконка (mipmap/drawable/values)
│       └── assets/                # создаётся при сборке из architecture-canvas/
├── build.gradle                   # версия Android Gradle Plugin
├── gradle.properties
└── settings.gradle
```

`copyCanvasAssets` копирует `index.html`, `core.js` и `presets.js` из `../architecture-canvas`, а `copyLicenseAsset` — `LICENSE` из корня. Так доска остаётся единственным источником кода, а APK — просто способ доставить её на планшет.

## Готовые файлы из GitHub Actions

Сборка запускается **вручную**: репозиторий → [Actions → APK и офлайн-архив](https://github.com/okinokii/architecture-canvas/actions/workflows/android.yml) → **Run workflow**. Запуск на теге автоматически прикрепляет файлы к [релизу](https://github.com/okinokii/architecture-canvas/releases/latest).

В релизе ровно два файла:

- `ArchitectureCanvas-v*.apk` — установить на планшет;
- `ArchitectureCanvas-standalone-v*.zip` — распаковать и открыть `index.html` на компьютере.

Артефакт workflow `architecture-canvas-dist` содержит те же файлы. Инструкция по доске доступна в приложении: меню **«Справка → Как пользоваться»**. Онлайн-версия: https://okinokii.github.io/architecture-canvas/ .

## Сборка локально

Нужны JDK 17, Android SDK (platform 35, build-tools 35.0.0) и Gradle 8.11+ (например, через `gradle/actions/setup-gradle` или локальную установку).

```powershell
$env:ANDROID_HOME = "C:\Users\<вы>\AppData\Local\Android\Sdk"
sdkmanager "platforms;android-35" "build-tools;35.0.0"
gradle -p android assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk` (подписан debug-ключом, пригоден для side-load).

Установка на планшет:

```powershell
adb devices
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Такой же APK из релиза можно просто открыть на планшете — install via ADB не обязательна.

## Особенности

- `file:///android_asset/index.html` — приложение полностью офлайн, интернет не требуется.
- `domStorageEnabled` — autosave и версии работают внутри WebView.
- `useWideViewPort` + `viewport` из HTML — корректный масштаб на экране Tab S8 Ultra (2560×1600).
- Полноэкранный режим с учётом `displayCutout`, системная кнопка «Назад» сначала закрывает модальные окна/возвращает WebView назад.
- В доске включены крупные цели касания, авто-масштаб интерфейса 125 % на больших сенсорных экранах, palm rejection и поддержка нажима/наклона S Pen.
- Иконка приложения — свободный Lucide `workflow` (ISC): адаптивная иконка для Android 8+ и PNG-заглушки для старых версий.
- Web Speech API (диктовка) в системном WebView может отсутствовать — для неё используйте Chrome/Edge.

Подпись для Google Play не настроена намеренно: APK предназначен для прямой установки на свой планшет. При необходимости замените `signingConfig signingConfigs.debug` в `app/build.gradle` на свой keystore.
