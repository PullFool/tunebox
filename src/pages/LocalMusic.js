import React, { useState, useRef, useCallback } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { IoCloudUpload, IoMusicalNotes, IoPlay, IoAdd } from 'react-icons/io5';

function LocalMusic() {
  const { playSong, currentSong, isPlaying, playlists, addToPlaylist } = usePlayer();
  const [localSongs, setLocalSongs] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(null);
  const fileInputRef = useRef();

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

  return (
    <div className="page">
      <h1 className="page-title">My Music</h1>

      <div
        className="upload-area"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <IoCloudUpload className="icon" />
        <p>Tap to add music files</p>
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

      {localSongs.length === 0 ? (
        <div className="empty-state">
          <IoMusicalNotes className="icon" />
          <h3>No music yet</h3>
          <p>Add music files or stream from YouTube</p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
            {localSongs.length} song{localSongs.length !== 1 ? 's' : ''}
          </p>
          <ul className="song-list">
            {localSongs.map((song, index) => (
              <li
                key={song.id}
                className={`song-item ${currentSong?.url === song.url ? 'active' : ''}`}
                onClick={() => playSong(localSongs, index)}
              >
                <span className="song-item-number">
                  {currentSong?.url === song.url && isPlaying ? (
                    <IoPlay style={{ color: 'var(--green)' }} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="song-item-art">
                  <IoMusicalNotes className="icon" />
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
