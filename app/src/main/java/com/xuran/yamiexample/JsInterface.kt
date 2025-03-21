package com.xuran.yamiexample

import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebView
import android.widget.Toast
import com.taptap.sdk.achievement.options.TapTapAchievementOptions
import com.taptap.sdk.compliance.option.TapTapComplianceOptions
import com.taptap.sdk.core.TapTapLanguage
import com.taptap.sdk.core.TapTapSdk
import com.taptap.sdk.core.TapTapSdkOptions
import com.taptap.sdk.kit.internal.callback.TapTapCallback
import com.taptap.sdk.kit.internal.exception.TapTapException
import com.taptap.sdk.login.Scopes
import com.taptap.sdk.login.TapTapAccount
import com.taptap.sdk.login.TapTapLogin
import org.json.JSONObject
import java.lang.ref.WeakReference


internal class JsInterface private constructor() {
    private var activityRef = WeakReference<Activity>(null)
    private var webViewRef = WeakReference<WebView>(null)
    private var clientId = ""

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

    @JavascriptInterface
    fun toast(str: String) {
        activityRef.get()?.let { activity ->
            Toast.makeText(getApplicationContext(), str, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun loginTapTap(sid: String, fid: String, cid: String) {
        val webView = webViewRef.get()
        activityRef.get()?.let { activity ->

            if (webView == null || activity == null) {
                return
            }

            val scopes = mutableSetOf(clientId)
            scopes.add(Scopes.SCOPE_PUBLIC_PROFILE)

            TapTapLogin.loginWithScopes(
                activity,
                scopes.toTypedArray(),
                object : TapTapCallback<TapTapAccount> {

                    override fun onSuccess(result: TapTapAccount) {
                        result.unionId
                        val code =
                            "javascript:var list = new EventHandler(EventManager.guidMap['${sid}']);\n" + "list.attributes['unionId'] = '${result.unionId}';" + "list.attributes['openId'] ='${result.openId}';" + "list.attributes['accessToken'] ='${result.accessToken}';" + "list.attributes['avatar'] ='${result.avatar}';" + "list.attributes['email'] ='${result.email}';" + "list.attributes['name'] ='${result.name}';" + "EventHandler.call(list);"
                        webViewRef.get()?.let { activity ->
                            webView.evaluateJavascript(code, ValueCallback<String> {})
                        }

                    }

                    override fun onCancel() {
                        webViewRef.get()?.let { activity ->
                            webView.evaluateJavascript("javascript:EventManager.call(${cid})",
                                ValueCallback<String> {})
                        }
                    }

                    override fun onFail(exception: TapTapException) {
                        webViewRef.get()?.let { activity ->
                            webView.evaluateJavascript("javascript:EventManager.call(${fid})",
                                ValueCallback<String> {})
                        }
                    }
                })
        }
    }

    @JavascriptInterface
    fun initTapTap(config: String) {
        activityRef.get()?.runOnUiThread {
            val configObj = JSONObject(config)
            TapTapSdk.init(
                getApplicationContext(), TapTapSdkOptions(
                    configObj.getString("clientId"), // 游戏 Client ID
                    configObj.getString("clientToken"), // 游戏 Client Token
                    configObj.getInt("region"), // 游戏可玩区域: [TapTapRegion.CN]=国内 [TapTapRegion.GLOBAL]=海外
                    configObj.getString("channel"), // 分包渠道名称
                    configObj.getString("gameVersion"), // 游戏版本号
                    configObj.getBoolean("autoIAPEventEnabled"), // 是否自动上报 GooglePlay 内购支付成功事件 仅 [TapTapRegion.GLOBAL] 生效
                    configObj.getBoolean("overrideBuiltInParameters"), // 自定义字段是否能覆盖内置字段
                    JSONObject(), // 自定义属性，启动首个预置事件（device_login）会带上这些属性
                    configObj.getString("oaidCert"), // OAID 证书, 用于上报 OAID 仅 [TapTapRegion.CN] 生效
                    configObj.getBoolean("enableLog"), // 是否开启 log，建议 Debug 开启，Release 关闭，默认关闭 log
                    TapTapLanguage.AUTO, // TapSDK 首选语言 默认为 TapTapLanguage.AUTO
                ), TapTapAchievementOptions(
                    // 成就达成时 SDK 是否需要展示一个气泡弹窗提示
                    enableToast = true
                ), TapTapComplianceOptions(
                    showSwitchAccount = true,
                    useAgeRange = false,
                )
            )
            clientId = configObj.getString("clientId")
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