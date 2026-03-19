package com.tunebox.app

import android.app.Application
import android.util.Log
import com.tunebox.app.data.AppDatabase
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class TuneboxApp : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @Volatile
    var isYtDlpReady = false
        private set

    var ytDlpError: String? = null
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        initYoutubeDL()
    }

    private fun initYoutubeDL() {
        applicationScope.launch {
            try {
                YoutubeDL.getInstance().init(this@TuneboxApp)
                isYtDlpReady = true
                Log.d("TuneboxApp", "yt-dlp initialized successfully")
            } catch (e: YoutubeDLException) {
                ytDlpError = "Init error: ${e.message}"
                Log.e("TuneboxApp", "yt-dlp init YoutubeDLException: ${e.message}", e)
            } catch (e: Exception) {
                ytDlpError = "Init error: ${e.message}"
                Log.e("TuneboxApp", "yt-dlp init failed: ${e.message}", e)
            }

            // Try update separately (non-blocking, can fail)
            if (isYtDlpReady) {
                try {
                    YoutubeDL.getInstance().updateYoutubeDL(this@TuneboxApp)
                    Log.d("TuneboxApp", "yt-dlp updated successfully")
                } catch (e: Exception) {
                    Log.w("TuneboxApp", "yt-dlp update skipped: ${e.message}")
                    // Update failure is fine, init already succeeded
                }
            }
        }
    }

    fun retryInit() {
        isYtDlpReady = false
        ytDlpError = null
        initYoutubeDL()
    }

    companion object {
        lateinit var instance: TuneboxApp
            private set
    }
}
