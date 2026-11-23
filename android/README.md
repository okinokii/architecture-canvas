# APK для Android-планшета

Минимальный Android-проект, который открывает офлайн-доску Architecture Canvas в полноэкранном WebView. Написан на чистом Java + Android SDK, без npm-зависимостей и без proprietary Samsung SDK. S Pen работает через стандартные Pointer Events.

## Что внутри

```text
android/
├── app/
│   ├── build.gradle               # AGP, compileSdk 35, копирование веб-ассетов
│   └── src/main/
│       ├── AndroidManifest.xml    # полноэкранная Activity без ActionBar
│       ├── java/.../MainActivity.java
│       ├── res/values/            # имя приложения и тема
│       └── assets/                # создаётся при сборке из architecture-canvas/
├── build.gradle                   # версия Android Gradle Plugin
├── gradle.properties
└── settings.gradle
```

`copyCanvasAssets` копирует `index.html`, `core.js` и `presets.js` из `../architecture-canvas` в `app/src/main/assets`. Таким образом доска остаётся единственным источником кода, а APK — просто способ её доставить на планшет.

## Готовый APK из GitHub Actions

1. Откройте репозиторий → **Actions** → **Android APK** → **Run workflow**.
2. Дождитесь сборки и скачайте артефакт `architecture-canvas-apk` (внутри `app-debug.apk` и `app-release-unsigned` с подписью debug-ключом — оба пригодны для side-load).
3. Либо создайте тег `v1.0.0` и запушьте его: workflow прикрепит APK к GitHub Release.

## Сборка локально

Нужны JDK 17, Android SDK (platform 35, build-tools 35.0.0) и Gradle 8.11+ (например, через `gradle/actions/setup-gradle` или локальную установку).

```powershell
$env:ANDROID_HOME = "C:\Users\<вы>\AppData\Local\Android\Sdk"
sdkmanager "platforms;android-35" "build-tools;35.0.0"
gradle -p android assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

Установка на планшет:

```powershell
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Особенности

- `file:///android_asset/index.html` — приложение полностью офлайн, интернет не требуется.
- `domStorageEnabled` — autosave и версии работают внутри WebView.
- `useWideViewPort` + `viewport` из HTML — корректный масштаб на экране Tab S8 Ultra (2560×1600).
- Полноэкранный режим с учётом `displayCutout`, системная кнопка «Назад» сначала закрывает модальные окна/возвращает WebView назад.
- В доске включены крупные цели касания, авто-масштаб интерфейса 125 % на больших сенсорных экранах, palm rejection и поддержка нажима/наклона S Pen.
- Web Speech API (диктовка) в системном WebView может отсутствовать — для неё используйте Chrome/Edge.

Подпись для Google Play не настроена намеренно: APK предназначен для прямой установки на свой планшет. При необходимости замените `signingConfig signingConfigs.debug` в `app/build.gradle` на свой keystore.
