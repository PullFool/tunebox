package com.tunebox.app.player

import android.content.ComponentName
import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.MoreExecutors
import com.tunebox.app.data.Song

class PlayerManager(context: Context) {

    private var mediaController: MediaController? = null

    private val _currentSong = MutableLiveData<Song?>()
    val currentSong: LiveData<Song?> = _currentSong

    private val _isPlaying = MutableLiveData(false)
    val isPlaying: LiveData<Boolean> = _isPlaying

    private val _currentPosition = MutableLiveData(0L)
    val currentPosition: LiveData<Long> = _currentPosition

    private val _duration = MutableLiveData(0L)
    val duration: LiveData<Long> = _duration

    private val _shuffleEnabled = MutableLiveData(false)
    val shuffleEnabled: LiveData<Boolean> = _shuffleEnabled

    private val _repeatMode = MutableLiveData(Player.REPEAT_MODE_OFF)
    val repeatMode: LiveData<Int> = _repeatMode

    private var playlist: List<Song> = emptyList()
    private var currentIndex: Int = -1

    init {
        val sessionToken = SessionToken(
            context,
            ComponentName(context, MusicPlayerService::class.java)
        )
        val controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
        controllerFuture.addListener({
            mediaController = controllerFuture.get()
            setupPlayerListener()
        }, MoreExecutors.directExecutor())
    }

    private fun setupPlayerListener() {
        mediaController?.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                _isPlaying.postValue(isPlaying)
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                val index = mediaController?.currentMediaItemIndex ?: return
                if (index in playlist.indices) {
                    currentIndex = index
                    _currentSong.postValue(playlist[index])
                }
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_READY) {
                    _duration.postValue(mediaController?.duration ?: 0L)
                }
            }
        })
    }

    fun playSongs(songs: List<Song>, startIndex: Int = 0) {
        playlist = songs
        currentIndex = startIndex

        val mediaItems = songs.map { song ->
            MediaItem.Builder()
                .setUri(song.filePath)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(song.title)
                        .setArtist(song.artist)
                        .setAlbumTitle(song.album)
                        .build()
                )
                .build()
        }

        mediaController?.apply {
            setMediaItems(mediaItems, startIndex, 0)
            prepare()
            play()
        }

        _currentSong.postValue(songs[startIndex])
    }

    fun play() { mediaController?.play() }
    fun pause() { mediaController?.pause() }

    fun togglePlayPause() {
        if (mediaController?.isPlaying == true) pause() else play()
    }

    fun skipNext() { mediaController?.seekToNextMediaItem() }
    fun skipPrevious() { mediaController?.seekToPreviousMediaItem() }

    fun seekTo(position: Long) { mediaController?.seekTo(position) }

    fun toggleShuffle() {
        val enabled = !(mediaController?.shuffleModeEnabled ?: false)
        mediaController?.shuffleModeEnabled = enabled
        _shuffleEnabled.postValue(enabled)
    }

    fun toggleRepeat() {
        val nextMode = when (mediaController?.repeatMode) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
            Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
            else -> Player.REPEAT_MODE_OFF
        }
        mediaController?.repeatMode = nextMode
        _repeatMode.postValue(nextMode)
    }

    fun updatePosition() {
        _currentPosition.postValue(mediaController?.currentPosition ?: 0L)
        _duration.postValue(mediaController?.duration ?: 0L)
    }

    fun release() {
        mediaController?.release()
    }
}
