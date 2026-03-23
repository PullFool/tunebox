import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { IoAdd, IoMusicalNotes, IoTrash } from 'react-icons/io5';

function Playlists() {
  const { playlists, createPlaylist, deletePlaylist } = usePlayer();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName('');
      setShowModal(false);
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Playlists</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <IoAdd style={{ marginRight: 4 }} /> New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <IoMusicalNotes className="icon" />
          <h3>No playlists yet</h3>
          <p>Create a playlist and add songs to it</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {playlists.map(p => (
            <div
              key={p.id}
              style={{
                background: 'var(--bg-card)', borderRadius: 8,
                padding: 16, cursor: 'pointer', transition: 'background 0.2s',
              }}
              onClick={() => navigate(`/playlist/${p.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 6,
                background: 'var(--bg-surface)', marginBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {p.songs.length > 0 && p.songs[0].cover ? (
                  <img src={p.songs[0].cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <IoMusicalNotes style={{ fontSize: 48, color: 'var(--text-muted)' }} />
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{p.songs.length} song{p.songs.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 }}
                >
                  <IoTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Playlist</h3>
            <input
              type="text"
              placeholder="Playlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists;
