package com.tunebox.app.youtube

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.tunebox.app.TuneboxApp
import com.tunebox.app.data.Song
import kotlinx.coroutines.launch

class YouTubeViewModel(application: Application) : AndroidViewModel(application) {

    private val downloader = YouTubeDownloader(application)
    private val songDao = (application as TuneboxApp).database.songDao()

    private val _downloadProgress = MutableLiveData<Pair<String, Float>?>()
    val downloadProgress: LiveData<Pair<String, Float>?> = _downloadProgress

    private val _downloadComplete = MutableLiveData<Song?>()
    val downloadComplete: LiveData<Song?> = _downloadComplete

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private var isDownloading = false

    fun download(videoUrl: String) {
        if (isDownloading) {
            _error.value = "A download is already in progress"
            return
        }

        viewModelScope.launch {
            isDownloading = true
            _downloadProgress.value = Pair("Preparing...", 0f)
            try {
                val song = downloader.download(videoUrl) { progress, status ->
                    _downloadProgress.postValue(Pair(status, progress))
                }

                if (song != null) {
                    songDao.insert(song)
                    _downloadComplete.postValue(song)
                } else {
                    _error.postValue("Download failed")
                }
            } catch (e: Exception) {
                _error.postValue("Download error: ${e.message}")
            } finally {
                isDownloading = false
                _downloadProgress.postValue(null)
            }
        }
    }
}
