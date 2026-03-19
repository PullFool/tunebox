package com.tunebox.app

import android.app.Application
import android.util.Log
import com.tunebox.app.data.AppDatabase
import com.yausername.youtubedl_android.YoutubeDL
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class TuneboxApp : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    var isYtDlpReady = false
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
                Log.d("TuneboxApp", "yt-dlp initialized")
                try {
                    YoutubeDL.getInstance().updateYoutubeDL(this@TuneboxApp)
                    Log.d("TuneboxApp", "yt-dlp updated")
                } catch (e: Exception) {
                    Log.w("TuneboxApp", "yt-dlp update failed (non-fatal): ${e.message}")
                }
                isYtDlpReady = true
            } catch (e: Exception) {
                Log.e("TuneboxApp", "yt-dlp init failed: ${e.message}", e)
            }
        }
    }

    companion object {
        lateinit var instance: TuneboxApp
            private set
    }
}
