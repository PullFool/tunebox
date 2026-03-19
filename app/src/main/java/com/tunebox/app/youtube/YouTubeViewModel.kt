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

    private val _searchResults = MutableLiveData<List<YouTubeResult>>()
    val searchResults: LiveData<List<YouTubeResult>> = _searchResults

    private val _isSearching = MutableLiveData(false)
    val isSearching: LiveData<Boolean> = _isSearching

    private val _downloadProgress = MutableLiveData<Pair<String, Float>?>()
    val downloadProgress: LiveData<Pair<String, Float>?> = _downloadProgress

    private val _downloadComplete = MutableLiveData<Song?>()
    val downloadComplete: LiveData<Song?> = _downloadComplete

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun search(query: String) {
        if (query.isBlank()) return

        viewModelScope.launch {
            _isSearching.value = true
            _error.value = null
            try {
                val results = downloader.search(query)
                _searchResults.value = results
                if (results.isEmpty()) {
                    _error.value = "No results found"
                }
            } catch (e: Exception) {
                _error.value = "Search failed: ${e.message}"
            } finally {
                _isSearching.value = false
            }
        }
    }

    fun download(result: YouTubeResult) {
        viewModelScope.launch {
            _downloadProgress.value = Pair(result.title, 0f)
            try {
                val song = downloader.download(result.url) { progress, _ ->
                    _downloadProgress.postValue(Pair(result.title, progress))
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
                _downloadProgress.postValue(null)
            }
        }
    }
}
