import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { IoArrowBack, IoPlay, IoMusicalNotes, IoTrash, IoAdd, IoCheckmark, IoSearch } from 'react-icons/io5';

const API_BASE = '/tunebox/api';

function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlists, playSong, currentSong, isPlaying, removeFromPlaylist, addToPlaylist } = usePlayer();
  const [showAddModal, setShowAddModal] = useState(false);
  const [librarySongs, setLibrarySongs] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const playlist = playlists.find(p => p.id === Number(id));

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/library.php`);
      const data = await res.json();
      if (data.songs) {
        setLibrarySongs(data.songs.map(s => ({
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

  const openAddModal = () => {
    setShowAddModal(true);
    loadLibrary();
  };

  if (!playlist) {
    return (
      <div className="page">
        <p>Playlist not found</p>
        <button className="btn btn-secondary" onClick={() => navigate('/playlists')}>Back</button>
      </div>
    );
  }

  const isSongInPlaylist = (songUrl) => {
    return playlist.songs.some(s => s.url === songUrl);
  };

  const filteredSongs = librarySongs.filter(s =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/playlists')}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 24 }}
        >
          <IoArrowBack />
        </button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{playlist.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IoAdd /> Add Songs
          </button>
          {playlist.songs.length > 0 && (
            <button className="btn btn-primary" onClick={() => playSong(playlist.songs, 0)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IoPlay /> Play All
            </button>
          )}
        </div>
      </div>

      {playlist.songs.length === 0 ? (
        <div className="empty-state">
          <IoMusicalNotes className="icon" />
          <h3>Empty playlist</h3>
          <p>Click "Add Songs" to browse your library</p>
        </div>
      ) : (
        <ul className="song-list">
          {playlist.songs.map((song, index) => (
            <li
              key={song.url + index}
              className={`song-item ${currentSong?.url === song.url ? 'active' : ''}`}
              onClick={() => playSong(playlist.songs, index)}
            >
              <span className="song-item-number">
                {currentSong?.url === song.url && isPlaying ? (
                  <IoPlay style={{ color: 'var(--green)' }} />
                ) : (
                  index + 1
                )}
              </span>
              <div className="song-item-art">
                {song.cover ? <img src={song.cover} alt="" /> : <IoMusicalNotes className="icon" />}
              </div>
              <div className="song-item-info">
                <div className="song-item-title">{song.title}</div>
                <div className="song-item-artist">{song.artist}</div>
              </div>
              <div style={{ opacity: 1 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlist.id, song.url); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', fontSize: 18 }}
                  title="Remove from playlist"
                >
                  <IoTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add Songs Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <h3>Add Songs to "{playlist.name}"</h3>

            {/* Search filter */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <IoSearch style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)', fontSize: 16 }} />
              <input
                type="text"
                placeholder="Search your library..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ paddingLeft: 36, marginBottom: 0 }}
                autoFocus
              />
            </div>

            {/* Song list */}
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16 }}>
              {loading ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Loading...</p>
              ) : filteredSongs.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                  {librarySongs.length === 0 ? 'No songs in library. Download some from YouTube first!' : 'No matching songs'}
                </p>
              ) : (
                <ul className="song-list">
                  {filteredSongs.map((song) => {
                    const added = isSongInPlaylist(song.url);
                    return (
                      <li
                        key={song.id}
                        className="song-item"
                        onClick={() => {
                          if (!added) {
                            addToPlaylist(playlist.id, song);
                          } else {
                            removeFromPlaylist(playlist.id, song.url);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="song-item-art">
                          <IoMusicalNotes className="icon" />
                        </div>
                        <div className="song-item-info">
                          <div className="song-item-title">{song.title}</div>
                          <div className="song-item-artist">{song.artist}</div>
                        </div>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: added ? 'var(--green)' : 'transparent',
                          border: added ? 'none' : '2px solid var(--border)',
                          color: added ? '#000' : 'var(--text-secondary)',
                          fontSize: 18, flexShrink: 0, transition: 'all 0.2s',
                        }}>
                          {added ? <IoCheckmark /> : <IoAdd />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowAddModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistDetail;
