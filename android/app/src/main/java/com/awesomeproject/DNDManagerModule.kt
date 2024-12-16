package com.awesomeproject

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*

class DNDManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val notificationManager =
        reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    override fun getName(): String {
        return "DNDManagerModule"
    }

    @ReactMethod
    @RequiresApi(Build.VERSION_CODES.M)
    fun requestPermission(promise: Promise) {
        if (!notificationManager.isNotificationPolicyAccessGranted) {
            try {
                val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve("Opening Notification Policy Access Settings")
            } catch (e: Exception) {
                promise.reject("ERROR", "Failed to open settings: ${e.message}")
            }
        } else {
            promise.resolve("Permission already granted")
        }
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val hasPermission = notificationManager.isNotificationPolicyAccessGranted
            promise.resolve(hasPermission)
        } else {
            promise.reject("NOT_SUPPORTED", "Not supported on this Android version")
        }
    }

    @ReactMethod
    fun getDNDMode(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            when (notificationManager.currentInterruptionFilter) {
                NotificationManager.INTERRUPTION_FILTER_NONE -> promise.resolve("DND_MODE")
                NotificationManager.INTERRUPTION_FILTER_ALL -> promise.resolve("NORMAL_MODE")
                else -> promise.resolve("UNKNOWN")
            }
        } else {
            promise.reject("NOT_SUPPORTED", "Not supported on this Android version")
        }
    }

    @ReactMethod
    fun setDNDMode(mode: String, promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!notificationManager.isNotificationPolicyAccessGranted) {
                promise.reject("PERMISSION_DENIED", "Notification policy access is not granted")
                return
            }
            when (mode) {
                "DND_MODE" -> notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                "NORMAL_MODE" -> notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
                "PRIORITY_MODE" -> notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
                else -> {
                    promise.reject("INVALID_MODE", "Invalid mode: $mode")
                    return
                }
            }
            promise.resolve("SUCCESS")
        } else {
            promise.reject("NOT_SUPPORTED", "Not supported on this Android version")
        }
    }
}
