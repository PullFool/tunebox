package com.tunebox.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "songs")
data class Song(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val artist: String,
    val album: String = "",
    val duration: Long = 0,
    val filePath: String,
    val albumArtUri: String = "",
    val source: String = SOURCE_LOCAL, // "local" or "youtube"
    val dateAdded: Long = System.currentTimeMillis()
) {
    companion object {
        const val SOURCE_LOCAL = "local"
        const val SOURCE_YOUTUBE = "youtube"
    }
}
