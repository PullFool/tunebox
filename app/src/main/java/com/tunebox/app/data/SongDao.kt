package com.tunebox.app.data

import androidx.lifecycle.LiveData
import androidx.room.*

@Dao
interface SongDao {

    @Query("SELECT * FROM songs ORDER BY title ASC")
    fun getAllSongs(): LiveData<List<Song>>

    @Query("SELECT * FROM songs WHERE source = :source ORDER BY title ASC")
    fun getSongsBySource(source: String): LiveData<List<Song>>

    @Query("SELECT * FROM songs WHERE title LIKE '%' || :query || '%' OR artist LIKE '%' || :query || '%' ORDER BY title ASC")
    fun searchSongs(query: String): LiveData<List<Song>>

    @Query("SELECT * FROM songs WHERE filePath = :path LIMIT 1")
    suspend fun getSongByPath(path: String): Song?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(song: Song): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(songs: List<Song>)

    @Delete
    suspend fun delete(song: Song)

    @Query("DELETE FROM songs WHERE id = :songId")
    suspend fun deleteById(songId: Long)

    @Query("SELECT COUNT(*) FROM songs")
    suspend fun getSongCount(): Int
}
