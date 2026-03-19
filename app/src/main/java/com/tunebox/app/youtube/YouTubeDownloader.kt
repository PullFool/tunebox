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
        File(context.getExternalFilesDir(null), "Music").also { it.mkdirs() }
    }

    private val app get() = context.applicationContext as TuneboxApp

    suspend fun download(
        videoUrl: String,
        onProgress: (Float, String) -> Unit = { _, _ -> }
    ): Song? = withContext(Dispatchers.IO) {
        // Wait for yt-dlp to be ready
        if (!app.isYtDlpReady) {
            onProgress(0f, "Initializing yt-dlp...")

            // If there was an error, retry
            if (app.ytDlpError != null) {
                app.retryInit()
            }

            var waited = 0
            while (!app.isYtDlpReady && app.ytDlpError == null && waited < 30) {
                Thread.sleep(1000)
                waited++
                onProgress(0f, "Initializing yt-dlp... (${waited}s)")
            }

            if (!app.isYtDlpReady) {
                val error = app.ytDlpError ?: "Timed out waiting for yt-dlp"
                throw Exception(error)
            }
        }

        val cleanUrl = cleanVideoUrl(videoUrl)
        Log.d("YTDownloader", "Downloading: $cleanUrl")

        var title = "Unknown"
        var artist = "Unknown"

        // Get video info
        try {
            onProgress(0f, "Getting video info...")
            val infoRequest = YoutubeDLRequest(cleanUrl)
            infoRequest.addOption("--no-download")
            infoRequest.addOption("-j")
            val infoResponse = YoutubeDL.getInstance().execute(infoRequest)
            infoResponse.out?.let { output ->
                try {
                    val json = org.json.JSONObject(output.trim())
                    title = json.optString("title", "Unknown")
                    artist = json.optString("channel", json.optString("uploader", "Unknown"))
                } catch (_: Exception) {}
            }
            Log.d("YTDownloader", "Info: $title by $artist")
        } catch (e: Exception) {
            Log.w("YTDownloader", "Info failed (continuing): ${e.message}")
        }

        // Download audio
        onProgress(5f, "Downloading audio...")
        val request = YoutubeDLRequest(cleanUrl)
        request.addOption("-f", "bestaudio[ext=m4a]/bestaudio/best")
        request.addOption("-x")
        request.addOption("--audio-format", "mp3")
        request.addOption("--audio-quality", "0")
        request.addOption("-o", "${downloadDir.absolutePath}/%(id)s.%(ext)s")
        request.addOption("--no-playlist")
        request.addOption("--no-mtime")
        request.addOption("--no-part")

        try {
            val response = YoutubeDL.getInstance().execute(request) { progress, _, line ->
                Log.d("YTDownloader", "Progress: $progress% - $line")
                onProgress(progress, "Downloading: ${progress.toInt()}%")
            }
            Log.d("YTDownloader", "Stdout: ${response.out?.take(500)}")
            Log.d("YTDownloader", "Stderr: ${response.err?.take(500)}")
        } catch (e: Exception) {
            Log.e("YTDownloader", "Execute failed: ${e.message}", e)
            throw Exception("Download failed: ${e.message}")
        }

        // Find downloaded file
        val audioFile = downloadDir.listFiles()
            ?.filter { it.extension in listOf("mp3", "m4a", "webm", "opus", "ogg", "wav") }
            ?.maxByOrNull { it.lastModified() }

        if (audioFile != null && audioFile.length() > 0) {
            Log.d("YTDownloader", "Success: ${audioFile.name} (${audioFile.length()} bytes)")
            Song(
                title = title,
                artist = artist,
                filePath = audioFile.absolutePath,
                source = Song.SOURCE_YOUTUBE,
                duration = 0
            )
        } else {
            val files = downloadDir.listFiles()?.map { "${it.name} (${it.length()})" }
            Log.e("YTDownloader", "No audio found. Files: $files")
            throw Exception("No audio file was created. The video may be restricted.")
        }
    }

    private fun cleanVideoUrl(url: String): String {
        val patterns = listOf(
            Regex("[?&]v=([a-zA-Z0-9_-]{11})"),
            Regex("youtu\\.be/([a-zA-Z0-9_-]{11})"),
            Regex("shorts/([a-zA-Z0-9_-]{11})")
        )
        for (pattern in patterns) {
            val match = pattern.find(url)
            if (match != null) {
                return "https://www.youtube.com/watch?v=${match.groupValues[1]}"
            }
        }
        return url
    }
}
