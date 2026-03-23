import React, { useState, useRef, useCallback, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { IoCloudUpload, IoMusicalNotes, IoPlay, IoAdd, IoRefresh } from 'react-icons/io5';

const API_BASE = '/tunebox/api';

function LocalMusic() {
  const { playSong, currentSong, isPlaying, playlists, addToPlaylist } = usePlayer();
  const [localSongs, setLocalSongs] = useState([]);
  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef();

  // Load downloaded songs from server
  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/library.php`);
      const data = await res.json();
      if (data.songs) {
        setDownloadedSongs(data.songs.map(s => ({
          ...s,
          url: `/tunebox/${s.file}`,
          cover: null,
          source: 'youtube',
        })));
      }
    } catch (e) {
      console.error('Failed to load library:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleFiles = useCallback((files) => {
    const audioFiles = Array.from(files).filter(f =>
      f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name)
    );

    const newSongs = audioFiles.map(file => ({
      id: `local-${Date.now()}-${Math.random()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local File',
      url: URL.createObjectURL(file),
      cover: null,
      source: 'local',
    }));

    setLocalSongs(prev => [...prev, ...newSongs]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = (e) => e.preventDefault();

  const allSongs = [...localSongs, ...downloadedSongs];

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>My Music</h1>
        <button
          onClick={loadLibrary}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20, padding: 8 }}
          title="Refresh library"
        >
          <IoRefresh />
        </button>
      </div>

      <div
        className="upload-area"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <IoCloudUpload className="icon" />
        <p>Drop music files here or click to upload</p>
        <p className="hint">Supports MP3, M4A, WAV, OGG, FLAC</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading library...</p>
        </div>
      ) : allSongs.length === 0 ? (
        <div className="empty-state">
          <IoMusicalNotes className="icon" />
          <h3>No music yet</h3>
          <p>Upload files or download from YouTube</p>
        </div>
      ) : (
        <>
          {downloadedSongs.length > 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
              {allSongs.length} song{allSongs.length !== 1 ? 's' : ''}
            </p>
          )}
          <ul className="song-list">
            {allSongs.map((song, index) => (
              <li
                key={song.id}
                className={`song-item ${currentSong?.url === song.url ? 'active' : ''}`}
                onClick={() => playSong(allSongs, index)}
              >
                <span className="song-item-number">
                  {currentSong?.url === song.url && isPlaying ? (
                    <IoPlay style={{ color: 'var(--green)' }} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="song-item-art">
                  {song.cover ? (
                    <img src={song.cover} alt="" />
                  ) : (
                    <IoMusicalNotes className="icon" />
                  )}
                </div>
                <div className="song-item-info">
                  <div className="song-item-title">{song.title}</div>
                  <div className="song-item-artist">{song.artist}</div>
                </div>
                <div className="song-item-actions" style={{ position: 'relative', opacity: 1 }}>
                  <button
                    title="Add to playlist"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPlaylistMenu(showPlaylistMenu === song.id ? null : song.id);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 8px', fontSize: 20 }}
                  >
                    <IoAdd />
                  </button>
                  {showPlaylistMenu === song.id && (
                    <div style={{
                      position: 'absolute', right: 0, top: '100%',
                      background: 'var(--bg-surface)', borderRadius: 8,
                      padding: 8, minWidth: 180, zIndex: 10,
                      border: '1px solid var(--border)'
                    }}>
                      {playlists.length === 0 ? (
                        <div style={{ padding: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                          No playlists yet
                        </div>
                      ) : (
                        playlists.map(p => (
                          <div
                            key={p.id}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 13 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToPlaylist(p.id, song);
                              setShowPlaylistMenu(null);
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            {p.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default LocalMusic;
