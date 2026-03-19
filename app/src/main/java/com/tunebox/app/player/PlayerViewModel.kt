package com.tunebox.app.player

import android.app.Application
import android.os.Handler
import android.os.Looper
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.tunebox.app.TuneboxApp
import com.tunebox.app.data.Song
import com.tunebox.app.local.LocalMusicScanner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PlayerViewModel(application: Application) : AndroidViewModel(application) {

    val playerManager = PlayerManager(application)
    private val musicScanner = LocalMusicScanner(application)
    private val songDao = (application as TuneboxApp).database.songDao()

    private val _localSongs = MutableLiveData<List<Song>>()
    val localSongs: LiveData<List<Song>> = _localSongs

    private val _songOptions = MutableLiveData<Song?>()
    val songOptions: LiveData<Song?> = _songOptions

    private val handler = Handler(Looper.getMainLooper())
    private val positionUpdater = object : Runnable {
        override fun run() {
            playerManager.updatePosition()
            handler.postDelayed(this, 500)
        }
    }

    init {
        handler.post(positionUpdater)
    }

    fun scanLocalMusic() {
        viewModelScope.launch {
            val songs = withContext(Dispatchers.IO) {
                val scanned = musicScanner.scanMusic()
                songDao.insertAll(scanned)
                scanned
            }
            _localSongs.value = songs
        }
    }

    fun playSongs(songs: List<Song>, startIndex: Int = 0) {
        playerManager.playSongs(songs, startIndex)
    }

    fun showSongOptions(song: Song) {
        _songOptions.value = song
    }

    fun clearSongOptions() {
        _songOptions.value = null
    }

    override fun onCleared() {
        super.onCleared()
        handler.removeCallbacks(positionUpdater)
        playerManager.release()
    }
}
