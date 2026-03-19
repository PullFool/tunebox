package com.tunebox.app.youtube

data class YouTubeResult(
    val videoId: String,
    val title: String,
    val channel: String,
    val duration: String,
    val thumbnailUrl: String,
    val url: String
)
