package com.tunebox.app.youtube

import android.content.Context
import android.util.Log
import com.tunebox.app.TuneboxApp
import com.tunebox.app.data.Song
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class YouTubeDownloader(private val context: Context) {

    private val downloadDir: File by lazy {
        // Use app-specific directory (no extra permissions needed)
        File(context.getExternalFilesDir(null), "Music").also { it.mkdirs() }
    }

    suspend fun download(
        videoUrl: String,
        onProgress: (Float, String) -> Unit = { _, _ -> }
    ): Song? = withContext(Dispatchers.IO) {
        try {
            // Check if yt-dlp is ready
            if (!(context.applicationContext as TuneboxApp).isYtDlpReady) {
                onProgress(0f, "Waiting for yt-dlp to initialize...")
                // Wait up to 15 seconds for init
                var waited = 0
                while (!(context.applicationContext as TuneboxApp).isYtDlpReady && waited < 15) {
                    Thread.sleep(1000)
                    waited++
                }
                if (!(context.applicationContext as TuneboxApp).isYtDlpReady) {
                    throw Exception("yt-dlp failed to initialize. Please restart the app.")
                }
            }

            Log.d("YTDownloader", "Starting download: $videoUrl")
            Log.d("YTDownloader", "Download dir: ${downloadDir.absolutePath}")

            // Clean the URL (remove extra params from WebView)
            val cleanUrl = cleanVideoUrl(videoUrl)
            Log.d("YTDownloader", "Clean URL: $cleanUrl")

            var title = "Unknown"
            var artist = "Unknown"

            // Get video info first
            try {
                onProgress(0f, "Getting video info...")
                val infoRequest = YoutubeDLRequest(cleanUrl)
                infoRequest.addOption("--no-download")
                infoRequest.addOption("--print", "%(title)s|||%(channel)s")
                val infoResponse = YoutubeDL.getInstance().execute(infoRequest)
                infoResponse.out?.let { output ->
                    val parts = output.trim().split("|||")
                    if (parts.isNotEmpty()) title = parts[0].trim()
                    if (parts.size > 1) artist = parts[1].trim()
                }
                Log.d("YTDownloader", "Video info: $title by $artist")
            } catch (e: Exception) {
                Log.w("YTDownloader", "Info fetch failed: ${e.message}")
            }

            // Download as audio
            onProgress(5f, "Downloading...")
            val request = YoutubeDLRequest(cleanUrl)
            request.addOption("-x")
            request.addOption("--audio-format", "mp3")
            request.addOption("--audio-quality", "0")
            request.addOption("-o", "${downloadDir.absolutePath}/%(title)s.%(ext)s")
            request.addOption("--no-playlist")
            request.addOption("--no-mtime")
            // Skip thumbnail embedding (can cause failures)
            // request.addOption("--embed-thumbnail")

            val response = YoutubeDL.getInstance().execute(request) { progress, _, line ->
                Log.d("YTDownloader", "Progress: $progress - $line")
                onProgress(progress, line ?: "Downloading...")
            }

            Log.d("YTDownloader", "Download stdout: ${response.out}")
            Log.d("YTDownloader", "Download stderr: ${response.err}")

            // Find the downloaded file (most recently modified mp3)
            val mp3File = downloadDir.listFiles()
                ?.filter { it.extension == "mp3" }
                ?.maxByOrNull { it.lastModified() }

            if (mp3File != null) {
                Log.d("YTDownloader", "Found file: ${mp3File.absolutePath} (${mp3File.length()} bytes)")
                Song(
                    title = title,
                    artist = artist,
                    filePath = mp3File.absolutePath,
                    source = Song.SOURCE_YOUTUBE,
                    duration = 0
                )
            } else {
                // Maybe it saved as a different format, check all audio files
                val anyAudio = downloadDir.listFiles()
                    ?.filter { it.extension in listOf("mp3", "m4a", "webm", "opus", "ogg") }
                    ?.maxByOrNull { it.lastModified() }

                if (anyAudio != null) {
                    Log.d("YTDownloader", "Found non-mp3: ${anyAudio.absolutePath}")
                    Song(
                        title = title,
                        artist = artist,
                        filePath = anyAudio.absolutePath,
                        source = Song.SOURCE_YOUTUBE,
                        duration = 0
                    )
                } else {
                    Log.e("YTDownloader", "No audio file found in ${downloadDir.absolutePath}")
                    Log.e("YTDownloader", "Files in dir: ${downloadDir.listFiles()?.map { it.name }}")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e("YTDownloader", "Download failed: ${e.message}", e)
            throw e  // Re-throw so ViewModel can show the actual error message
        }
    }

    private fun cleanVideoUrl(url: String): String {
        // Extract video ID and build clean URL
        val patterns = listOf(
            Regex("[?&]v=([a-zA-Z0-9_-]{11})"),
            Regex("youtu\\.be/([a-zA-Z0-9_-]{11})"),
            Regex("shorts/([a-zA-Z0-9_-]{11})")
        )

        for (pattern in patterns) {
            val match = pattern.find(url)
            if (match != null) {
                val videoId = match.groupValues[1]
                return "https://www.youtube.com/watch?v=$videoId"
            }
        }

        return url
    }
}
