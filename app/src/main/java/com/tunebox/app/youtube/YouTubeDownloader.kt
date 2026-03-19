package com.tunebox.app.youtube

import android.content.Context
import android.os.Environment
import com.tunebox.app.data.Song
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class YouTubeDownloader(private val context: Context) {

    private val downloadDir: File by lazy {
        File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC),
            "Tunebox"
        ).also { it.mkdirs() }
    }

    suspend fun search(query: String): List<YouTubeResult> = withContext(Dispatchers.IO) {
        try {
            val request = YoutubeDLRequest("ytsearch10:$query")
            request.addOption("--flat-playlist")
            request.addOption("-j")
            request.addOption("--no-download")

            val response = YoutubeDL.getInstance().execute(request)
            val results = mutableListOf<YouTubeResult>()

            response.out?.lines()?.forEach { line ->
                if (line.isBlank()) return@forEach
                try {
                    val json = org.json.JSONObject(line)
                    results.add(
                        YouTubeResult(
                            videoId = json.optString("id", ""),
                            title = json.optString("title", "Unknown"),
                            channel = json.optString("channel", json.optString("uploader", "Unknown")),
                            duration = formatSeconds(json.optDouble("duration", 0.0).toLong()),
                            thumbnailUrl = json.optString("thumbnail", ""),
                            url = json.optString("url", json.optString("webpage_url", "https://youtube.com/watch?v=${json.optString("id")}"))
                        )
                    )
                } catch (_: Exception) {}
            }

            results
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun download(
        videoUrl: String,
        onProgress: (Float, String) -> Unit = { _, _ -> }
    ): Song? = withContext(Dispatchers.IO) {
        try {
            val request = YoutubeDLRequest(videoUrl)
            request.addOption("-x")
            request.addOption("--audio-format", "mp3")
            request.addOption("--audio-quality", "0")
            request.addOption("-o", "${downloadDir.absolutePath}/%(title)s.%(ext)s")
            request.addOption("--no-playlist")
            request.addOption("--embed-thumbnail")
            request.addOption("--add-metadata")

            var title = "Unknown"
            var artist = "Unknown"

            // Get video info first
            val infoRequest = YoutubeDLRequest(videoUrl)
            infoRequest.addOption("-j")
            infoRequest.addOption("--no-download")
            val infoResponse = YoutubeDL.getInstance().execute(infoRequest)
            infoResponse.out?.let { output ->
                try {
                    val json = org.json.JSONObject(output)
                    title = json.optString("title", "Unknown")
                    artist = json.optString("channel", json.optString("uploader", "Unknown"))
                } catch (_: Exception) {}
            }

            // Download
            YoutubeDL.getInstance().execute(request) { progress, _, line ->
                onProgress(progress, line ?: "")
            }

            // Find the downloaded file
            val mp3File = downloadDir.listFiles()
                ?.filter { it.extension == "mp3" }
                ?.maxByOrNull { it.lastModified() }

            mp3File?.let {
                Song(
                    title = title,
                    artist = artist,
                    filePath = it.absolutePath,
                    source = Song.SOURCE_YOUTUBE,
                    duration = 0
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun formatSeconds(seconds: Long): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return "$mins:%02d".format(secs)
    }
}
