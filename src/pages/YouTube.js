import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { IoSearch, IoDownload, IoMusicalNotes, IoPlay, IoClose, IoPause } from 'react-icons/io5';

const API_BASE = '/tunebox/api';

function YouTube() {
  const { playSong, currentSong, isPlaying, downloadProgress, setDownloadProgress } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const [error, setError] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState(null);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/search.php?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (e) {
      setError('Search failed. Make sure XAMPP/Apache is running.');
    } finally {
      setSearching(false);
    }
  };

  const download = async (video) => {
    setDownloadProgress({ title: video.title, percent: 0, status: 'Starting...' });
    try {
      const res = await fetch(`${API_BASE}/download.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url, title: video.title }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const song = {
          id: `yt-${Date.now()}`,
          title: data.title || video.title,
          artist: video.channel || 'YouTube',
          url: `${API_BASE}/../${data.file}`,
          cover: video.thumbnail,
          source: 'youtube',
        };
        setDownloadedSongs(prev => [song, ...prev]);
      }
    } catch (e) {
      setError('Download failed: ' + e.message);
    } finally {
      setDownloadProgress(null);
    }
  };

  const togglePlay = (videoId) => {
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
    } else {
      setPlayingVideoId(videoId);
    }
  };

  const allSongs = downloadedSongs;

  return (
    <div className="page">
      <h1 className="page-title">YouTube</h1>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search for music..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'var(--bg-surface)',
            color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={search}
          disabled={searching}
          className="btn btn-primary"
          style={{ borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <IoSearch /> {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', padding: '8px 0', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Download progress */}
      {downloadProgress && (
        <div className="download-toast">
          <div className="title">{downloadProgress.title}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${downloadProgress.percent}%` }} />
          </div>
          <div className="status">{downloadProgress.status || 'Downloading...'}</div>
        </div>
      )}

      {/* YouTube Player */}
      {playingVideoId && (
        <div style={{
          position: 'relative', marginBottom: 20, borderRadius: 12,
          overflow: 'hidden', background: '#000',
        }}>
          <button
            onClick={() => setPlayingVideoId(null)}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 10,
              background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
              borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
          >
            <IoClose />
          </button>
          <iframe
            width="100%"
            height="220"
            src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1&rel=0`}
            title="YouTube player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>Search Results</h2>
          <ul className="song-list" style={{ marginBottom: 32 }}>
            {results.map((video, i) => (
              <li key={video.id || i} className="song-item" style={{ gap: 10 }}>
                {/* Thumbnail - click to play */}
                <div
                  onClick={() => togglePlay(video.id)}
                  style={{
                    width: 48, height: 48, borderRadius: 6, flexShrink: 0,
                    overflow: 'hidden', position: 'relative', cursor: 'pointer',
                  }}
                >
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IoMusicalNotes style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: playingVideoId === video.id ? 'rgba(29,185,84,0.7)' : 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}>
                    {playingVideoId === video.id ? (
                      <IoPause style={{ color: '#fff', fontSize: 20 }} />
                    ) : (
                      <IoPlay style={{ color: '#fff', fontSize: 20 }} />
                    )}
                  </div>
                </div>

                {/* Info - click to play */}
                <div
                  className="song-item-info"
                  onClick={() => togglePlay(video.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="song-item-title">{video.title}</div>
                  <div className="song-item-artist">{video.channel} • {video.duration}</div>
                </div>

                {/* Download button */}
                <button
                  onClick={() => download(video)}
                  disabled={downloadProgress !== null}
                  style={{
                    background: 'var(--green)', color: '#000', border: 'none',
                    borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                    opacity: downloadProgress ? 0.5 : 1,
                  }}
                >
                  <IoDownload /> MP3
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Downloaded Songs */}
      {allSongs.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>Downloaded</h2>
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
                  {song.cover ? <img src={song.cover} alt="" /> : <IoMusicalNotes className="icon" />}
                </div>
                <div className="song-item-info">
                  <div className="song-item-title">{song.title}</div>
                  <div className="song-item-artist">{song.artist}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {results.length === 0 && allSongs.length === 0 && !searching && (
        <div className="empty-state">
          <IoSearch className="icon" />
          <h3>Search YouTube</h3>
          <p>Find music and download as MP3</p>
        </div>
      )}
    </div>
  );
}

export default YouTube;
