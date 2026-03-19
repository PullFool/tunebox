package com.tunebox.app

import android.os.Bundle
import android.view.View
import android.widget.SeekBar
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.media3.common.Player
import com.bumptech.glide.Glide
import com.tunebox.app.databinding.ActivityMainBinding
import com.tunebox.app.local.LocalMusicFragment
import com.tunebox.app.player.PlayerViewModel
import com.tunebox.app.playlist.PlaylistFragment
import com.tunebox.app.utils.PermissionHelper
import com.tunebox.app.utils.TimeUtils
import com.tunebox.app.youtube.YouTubeSearchFragment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val playerViewModel: PlayerViewModel by viewModels()
    private var isUserSeeking = false

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.all { it.value }
        if (allGranted) {
            playerViewModel.scanLocalMusic()
        } else {
            Toast.makeText(this, "Permissions required to scan music", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupBottomNavigation()
        setupMiniPlayer()
        setupNowPlaying()
        checkPermissions()

        if (savedInstanceState == null) {
            loadFragment(LocalMusicFragment())
        }
    }

    private fun checkPermissions() {
        if (!PermissionHelper.hasPermissions(this)) {
            PermissionHelper.requestPermissions(permissionLauncher)
        } else {
            playerViewModel.scanLocalMusic()
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNav.setOnItemSelectedListener { item ->
            val fragment: Fragment = when (item.itemId) {
                R.id.nav_local -> LocalMusicFragment()
                R.id.nav_youtube -> YouTubeSearchFragment()
                R.id.nav_playlists -> PlaylistFragment()
                else -> return@setOnItemSelectedListener false
            }
            loadFragment(fragment)
            true
        }
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }

    private fun setupMiniPlayer() {
        val pm = playerViewModel.playerManager

        pm.currentSong.observe(this) { song ->
            if (song != null) {
                binding.miniPlayer.visibility = View.VISIBLE
                binding.miniPlayerTitle.text = song.title
                binding.miniPlayerArtist.text = song.artist

                Glide.with(this)
                    .load(song.albumArtUri)
                    .placeholder(R.drawable.ic_music_note)
                    .circleCrop()
                    .into(binding.miniPlayerArt)
            } else {
                binding.miniPlayer.visibility = View.GONE
            }
        }

        pm.isPlaying.observe(this) { playing ->
            binding.miniPlayerPlayPause.setImageResource(
                if (playing) R.drawable.ic_pause else R.drawable.ic_play
            )
            binding.npBtnPlayPause.setImageResource(
                if (playing) R.drawable.ic_pause else R.drawable.ic_play
            )
        }

        binding.miniPlayerPlayPause.setOnClickListener { pm.togglePlayPause() }
        binding.miniPlayer.setOnClickListener { showNowPlaying() }
    }

    private fun setupNowPlaying() {
        val pm = playerViewModel.playerManager

        pm.currentSong.observe(this) { song ->
            song?.let {
                binding.npTitle.text = it.title
                binding.npArtist.text = it.artist

                Glide.with(this)
                    .load(it.albumArtUri)
                    .placeholder(R.drawable.ic_music_note)
                    .into(binding.npAlbumArt)
            }
        }

        pm.currentPosition.observe(this) { position ->
            if (!isUserSeeking) {
                binding.npSeekBar.progress = position.toInt()
                binding.npCurrentTime.text = TimeUtils.formatDuration(position)
            }
        }

        pm.duration.observe(this) { duration ->
            binding.npSeekBar.max = duration.toInt()
            binding.npTotalTime.text = TimeUtils.formatDuration(duration)
        }

        pm.shuffleEnabled.observe(this) { enabled ->
            binding.npBtnShuffle.alpha = if (enabled) 1.0f else 0.5f
        }

        pm.repeatMode.observe(this) { mode ->
            when (mode) {
                Player.REPEAT_MODE_OFF -> {
                    binding.npBtnRepeat.setImageResource(R.drawable.ic_repeat)
                    binding.npBtnRepeat.alpha = 0.5f
                }
                Player.REPEAT_MODE_ALL -> {
                    binding.npBtnRepeat.setImageResource(R.drawable.ic_repeat)
                    binding.npBtnRepeat.alpha = 1.0f
                }
                Player.REPEAT_MODE_ONE -> {
                    binding.npBtnRepeat.setImageResource(R.drawable.ic_repeat_one)
                    binding.npBtnRepeat.alpha = 1.0f
                }
            }
        }

        binding.npBtnPlayPause.setOnClickListener { pm.togglePlayPause() }
        binding.npBtnNext.setOnClickListener { pm.skipNext() }
        binding.npBtnPrev.setOnClickListener { pm.skipPrevious() }
        binding.npBtnShuffle.setOnClickListener { pm.toggleShuffle() }
        binding.npBtnRepeat.setOnClickListener { pm.toggleRepeat() }
        binding.npBtnCollapse.setOnClickListener { hideNowPlaying() }

        binding.npSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    binding.npCurrentTime.text = TimeUtils.formatDuration(progress.toLong())
                }
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) { isUserSeeking = true }
            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                isUserSeeking = false
                seekBar?.progress?.toLong()?.let { pm.seekTo(it) }
            }
        })
    }

    private fun showNowPlaying() {
        binding.nowPlayingView.visibility = View.VISIBLE
    }

    private fun hideNowPlaying() {
        binding.nowPlayingView.visibility = View.GONE
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (binding.nowPlayingView.visibility == View.VISIBLE) {
            hideNowPlaying()
        } else {
            super.onBackPressed()
        }
    }
}
