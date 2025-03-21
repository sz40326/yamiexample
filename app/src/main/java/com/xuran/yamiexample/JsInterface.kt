package com.xuran.yamiexample

import android.app.Activity
import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.taptap.sdk.achievement.TapAchievementCallback
import com.taptap.sdk.achievement.TapTapAchievement
import com.taptap.sdk.achievement.TapTapAchievementResult
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
import com.taptap.sdk.update.TapTapUpdate
import com.taptap.sdk.update.TapTapUpdateCallback
import org.json.JSONObject
import java.lang.ref.WeakReference
import kotlin.random.Random

// Notification ID.
private var NOTIFICATION_ID = 1001099
const val CHANNEL_ID = "xuranchannel01"

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
    fun notifyApp(title: String, content: String) {
        activityRef.get()?.let {
            if (ContextCompat.checkSelfPermission(
                    getApplicationContext(), Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    it, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1
                )
                Toast.makeText(getApplicationContext(), "当前无通知权限", Toast.LENGTH_SHORT).show()
                return;
            }
            val notificationManager =
                getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val intent = Intent(getApplicationContext(), MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            val pendingIntent = PendingIntent.getActivity(
                getApplicationContext(),
                System.currentTimeMillis().toInt(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // 构建通知
            val notification = NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher) // 必须的小图标
                .setContentTitle(title).setContentText(content).setContentIntent(pendingIntent)
                .setAutoCancel(true) // 点击后自动移除通知
                .build()
            notificationManager.notify(NOTIFICATION_ID, notification)
            NOTIFICATION_ID += 1
        }
    }

    @JavascriptInterface
    fun achievementUnlockTapTap(id: String, value: String) {
        activityRef.get()?.let {
            if (value.toInt() == -1) TapTapAchievement.unlock(id)
            else {
                TapTapAchievement.increment(achievementId = id, steps = value.toInt())
            }
        }
    }

    @JavascriptInterface
    fun achievementInitTapTap(sid: String, fid: String) {
        val webView = webViewRef.get()
        activityRef.get()?.let {
            if (webView == null || it == null) {
                return
            }
            val callback = object : TapAchievementCallback {
                override fun onAchievementSuccess(code: Int, result: TapTapAchievementResult?) {
                    val code =
                        """javascript:var list = new EventHandler(EventManager.guidMap['${sid}']);
                            list.attributes['code'] = '${code}';
                            list.attributes['achievementId'] = '${result?.achievementId}';
                            list.attributes['achievementName'] = '${result?.achievementName}';
                            list.attributes['achievementType'] = '${result?.achievementType}';
                            list.attributes['currentSteps'] = '${result?.currentSteps}';
                            EventHandler.call(list);"""

                    webView.evaluateJavascript(code, ValueCallback<String> {})
                }

                override fun onAchievementFailure(
                    achievementId: String, errorCode: Int, errorMessage: String
                ) {
                    val code =
                        """javascript:var list = new EventHandler(EventManager.guidMap['${fid}']);
                            list.attributes['code'] = '${errorCode}';
                            list.attributes['achievementId'] = '${achievementId}';
                            list.attributes['errorMessage'] = '${errorMessage}';
                            EventHandler.call(list);"""

                    webView.evaluateJavascript(code, ValueCallback<String> {})
                }
            }

            TapTapAchievement.registerCallback(callback = callback)
            TapTapAchievement.unregisterCallback(callback)
        }
    }

    @JavascriptInterface
    fun updateTapTap(cid: String) {
        val webView = webViewRef.get()
        activityRef.get()?.let {
            if (webView == null || it == null) {
                return
            }
            TapTapUpdate.updateGame(activity = it, callback = object : TapTapUpdateCallback {

                override fun onCancel() {
                    webView.evaluateJavascript("javascript:EventManager.call(${cid})",
                        ValueCallback<String> {})
                }
            })
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

