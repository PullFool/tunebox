package com.tunebox.app.local

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.tunebox.app.adapter.SongAdapter
import com.tunebox.app.databinding.FragmentLocalMusicBinding
import com.tunebox.app.player.PlayerViewModel

class LocalMusicFragment : Fragment() {

    private var _binding: FragmentLocalMusicBinding? = null
    private val binding get() = _binding!!
    private val playerViewModel: PlayerViewModel by activityViewModels()
    private lateinit var songAdapter: SongAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLocalMusicBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        songAdapter = SongAdapter(
            onSongClick = { song, position ->
                val songs = songAdapter.currentList
                playerViewModel.playSongs(songs, position)
            },
            onMoreClick = { song ->
                playerViewModel.showSongOptions(song)
            }
        )

        binding.rvSongs.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = songAdapter
        }

        binding.swipeRefresh.setOnRefreshListener {
            playerViewModel.scanLocalMusic()
        }

        playerViewModel.localSongs.observe(viewLifecycleOwner) { songs ->
            songAdapter.submitList(songs)
            binding.swipeRefresh.isRefreshing = false
            binding.tvEmpty.visibility = if (songs.isEmpty()) View.VISIBLE else View.GONE
        }

        playerViewModel.scanLocalMusic()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
