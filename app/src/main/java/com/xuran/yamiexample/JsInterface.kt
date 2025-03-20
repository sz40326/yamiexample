package com.xuran.yamiexample

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.compose.ui.text.font.FontVariation
import java.lang.ref.WeakReference


internal class JsInterface private constructor() {
    private var activityRef = WeakReference<Activity>(null)
    private var webViewRef = WeakReference<WebView>(null)

    companion object {
        @Volatile
        private var instance: JsInterface? = null

        fun getInstance(): JsInterface {
            return instance ?: synchronized(this) {
                instance ?: JsInterface().also { instance = it }
            }
        }
    }

    fun init(activity: Activity, webView: WebView) {
        activityRef = WeakReference(activity)
        webViewRef = WeakReference(webView)
    }

    @JavascriptInterface
    fun exitApp() {
        activityRef.get()?.let { activity ->
            activity.finish()
        }
    }

    private fun getApplicationContext() =
        activityRef.get()?.applicationContext ?: android.app.Application()
}

fun Activity.registerJsInterface(webView: WebView, name: String) {
    JsInterface.getInstance().init(this, webView)
    webView.addJavascriptInterface(
        JsInterface.getInstance(), name
    )
}