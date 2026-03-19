package com.tunebox.app.youtube

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.tunebox.app.adapter.YouTubeResultAdapter
import com.tunebox.app.databinding.FragmentYoutubeBinding

class YouTubeSearchFragment : Fragment() {

    private var _binding: FragmentYoutubeBinding? = null
    private val binding get() = _binding!!
    private val viewModel: YouTubeViewModel by viewModels()
    private lateinit var resultAdapter: YouTubeResultAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentYoutubeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        resultAdapter = YouTubeResultAdapter { result ->
            viewModel.download(result)
        }

        binding.rvResults.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = resultAdapter
        }

        binding.etSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                performSearch()
                true
            } else false
        }

        binding.btnSearch.setOnClickListener { performSearch() }

        viewModel.searchResults.observe(viewLifecycleOwner) { results ->
            resultAdapter.submitList(results)
            binding.tvEmpty.visibility = if (results.isEmpty()) View.VISIBLE else View.GONE
        }

        viewModel.isSearching.observe(viewLifecycleOwner) { searching ->
            binding.progressBar.visibility = if (searching) View.VISIBLE else View.GONE
        }

        viewModel.downloadProgress.observe(viewLifecycleOwner) { progress ->
            if (progress != null) {
                binding.downloadBar.visibility = View.VISIBLE
                binding.tvDownloadStatus.visibility = View.VISIBLE
                binding.tvDownloadStatus.text = "Downloading: ${progress.first}"
                binding.downloadBar.progress = progress.second.toInt()
            } else {
                binding.downloadBar.visibility = View.GONE
                binding.tvDownloadStatus.visibility = View.GONE
            }
        }

        viewModel.downloadComplete.observe(viewLifecycleOwner) { song ->
            song?.let {
                Toast.makeText(requireContext(), "Downloaded: ${it.title}", Toast.LENGTH_SHORT).show()
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun performSearch() {
        val query = binding.etSearch.text.toString().trim()
        if (query.isNotEmpty()) {
            viewModel.search(query)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
