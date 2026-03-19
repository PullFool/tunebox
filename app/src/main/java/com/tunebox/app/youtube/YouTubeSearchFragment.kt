package com.tunebox.app.youtube

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.tunebox.app.databinding.FragmentYoutubeBinding

class YouTubeSearchFragment : Fragment() {

    private var _binding: FragmentYoutubeBinding? = null
    private val binding get() = _binding!!
    private val viewModel: YouTubeViewModel by viewModels()
    private var currentVideoUrl: String? = null
    private val handler = Handler(Looper.getMainLooper())
    private var lastCheckedUrl: String? = null

    // Poll the WebView URL every second to detect SPA navigation
    private val urlChecker = object : Runnable {
        override fun run() {
            if (_binding == null) return
            val url = binding.webView.url
            if (url != null && url != lastCheckedUrl) {
                lastCheckedUrl = url
                updateDownloadButton(url)
            }
            handler.postDelayed(this, 1000)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentYoutubeBinding.inflate(inflater, container, false)
        return binding.root
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupWebView()
        setupDownloadButton()
        observeViewModel()

        binding.webView.loadUrl("https://m.youtube.com")
        handler.post(urlChecker)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        binding.webView.apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = true
            settings.userAgentString =
                "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url?.toString() ?: return false
                    updateDownloadButton(url)
                    return false
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    updateDownloadButton(url)
                }

                override fun doUpdateVisitedHistory(
                    view: WebView?,
                    url: String?,
                    isReload: Boolean
                ) {
                    super.doUpdateVisitedHistory(view, url, isReload)
                    updateDownloadButton(url)
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    if (_binding == null) return
                    if (newProgress < 100) {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.progressBar.progress = newProgress
                    } else {
                        binding.progressBar.visibility = View.GONE
                    }
                    // Also check URL during page load
                    view?.url?.let { updateDownloadButton(it) }
                }
            }
        }
    }

    private fun updateDownloadButton(url: String?) {
        if (_binding == null || url == null) return

        val isVideoPage = url.contains("youtube.com/watch") ||
                url.contains("youtu.be/") ||
                url.contains("youtube.com/shorts/") ||
                url.contains("/watch?")

        if (isVideoPage) {
            currentVideoUrl = url
            binding.fabDownload.visibility = View.VISIBLE
        } else {
            currentVideoUrl = null
            binding.fabDownload.visibility = View.GONE
        }
    }

    private fun setupDownloadButton() {
        binding.fabDownload.setOnClickListener {
            val url = currentVideoUrl
            if (url != null) {
                viewModel.download(url)
                Toast.makeText(requireContext(), "Starting download...", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun observeViewModel() {
        viewModel.downloadProgress.observe(viewLifecycleOwner) { progress ->
            if (progress != null) {
                binding.downloadStatusBar.visibility = View.VISIBLE
                binding.tvDownloadStatus.text = "Downloading: ${progress.second.toInt()}%"
                binding.downloadBar.progress = progress.second.toInt()
            } else {
                binding.downloadStatusBar.visibility = View.GONE
            }
        }

        viewModel.downloadComplete.observe(viewLifecycleOwner) { song ->
            song?.let {
                Toast.makeText(requireContext(), "Downloaded: ${it.title}", Toast.LENGTH_SHORT)
                    .show()
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
            }
        }
    }

    fun canGoBack(): Boolean {
        return _binding?.webView?.canGoBack() == true
    }

    fun goBack() {
        _binding?.webView?.goBack()
    }

    override fun onDestroyView() {
        handler.removeCallbacks(urlChecker)
        _binding?.webView?.destroy()
        super.onDestroyView()
        _binding = null
    }
}
