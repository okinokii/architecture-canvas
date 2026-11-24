package com.okinokii.archcanvas;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Тонкая нативная обёртка вокруг офлайн-доски.
 * Вся логика остаётся в architecture-canvas/index.html — здесь только WebView,
 * полноэкранный режим и корректная обработка системной кнопки «Назад».
 */
public class MainActivity extends Activity {
    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // автосохранение и версии
        s.setAllowFileAccess(true);            // file:///android_asset/*
        s.setAllowContentAccess(false);        // content:// обёртке не нужен
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);            // учитывать viewport из HTML
        s.setBuiltInZoomControls(false);       // жесты обрабатывает сама доска
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        allowFileUrls(s);

        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.setBackgroundColor(0xff0b1020);
        web.loadUrl("file:///android_asset/index.html");
        hideSystemBars();
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemBars();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @SuppressWarnings("deprecation")
    private static void allowFileUrls(WebSettings s) {
        // core.js и presets.js лежат рядом с index.html в file:///android_asset/.
        // Доступа к любым другим origins (и content://) обёртке не нужно.
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(false);
    }

    private void hideSystemBars() {
        int flags = View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
        getWindow().getDecorView().setSystemUiVisibility(flags);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                    android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
    }
}
