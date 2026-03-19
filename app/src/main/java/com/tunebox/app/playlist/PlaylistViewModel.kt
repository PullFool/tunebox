package com.tunebox.app.playlist

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.viewModelScope
import com.tunebox.app.TuneboxApp
import com.tunebox.app.data.Playlist
import kotlinx.coroutines.launch

class PlaylistViewModel(application: Application) : AndroidViewModel(application) {

    private val playlistDao = (application as TuneboxApp).database.playlistDao()

    val playlists: LiveData<List<Playlist>> = playlistDao.getAllPlaylists()

    fun createPlaylist(name: String, description: String = "") {
        viewModelScope.launch {
            playlistDao.insertPlaylist(
                Playlist(name = name, description = description)
            )
        }
    }

    fun deletePlaylist(playlist: Playlist) {
        viewModelScope.launch {
            playlistDao.clearPlaylist(playlist.id)
            playlistDao.deletePlaylist(playlist)
        }
    }
}
