package com.tunebox.app

import android.app.Application
import com.tunebox.app.data.AppDatabase
import com.yausername.youtubedl_android.YoutubeDL
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class TuneboxApp : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        instance = this
        initYoutubeDL()
    }

    private fun initYoutubeDL() {
        applicationScope.launch {
            try {
                YoutubeDL.getInstance().init(this@TuneboxApp)
                YoutubeDL.getInstance().updateYoutubeDL(this@TuneboxApp)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    companion object {
        lateinit var instance: TuneboxApp
            private set
    }
}
