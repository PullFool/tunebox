import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';
import { IoMusicalNotes } from 'react-icons/io5';
import './Player.css';

function Player() {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    togglePlayPause, skipNext, skipPrev, seekTo, setVolumeLevel,
    setShowNowPlaying
  } = usePlayer();

  if (!currentSong) return null;

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-bar">
      <div className="player-progress-top">
        <input
          type="range" min="0" max={duration || 0} value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="player-seek"
        />
      </div>

      <div className="player-inner">
        <div className="player-song" onClick={() => setShowNowPlaying(true)}>
          <div className="player-art">
            {currentSong.cover ? (
              <img src={currentSong.cover} alt="" />
            ) : (
              <IoMusicalNotes className="icon" />
            )}
          </div>
          <div className="player-info">
            <div className="player-title">{currentSong.title}</div>
            <div className="player-artist">{currentSong.artist || 'Unknown'}</div>
          </div>
        </div>

        <div className="player-controls">
          <button onClick={skipPrev}><IoPlaySkipBack /></button>
          <button className="play-btn" onClick={togglePlayPause}>
            {isPlaying ? <IoPause /> : <IoPlay />}
          </button>
          <button onClick={skipNext}><IoPlaySkipForward /></button>
        </div>

        <div className="player-right">
          <span className="player-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="player-volume">
            <button onClick={() => setVolumeLevel(volume > 0 ? 0 : 0.8)}>
              {volume > 0 ? <IoVolumeHigh /> : <IoVolumeMute />}
            </button>
            <input
              type="range" min="0" max="1" step="0.01" value={volume}
              onChange={(e) => setVolumeLevel(Number(e.target.value))}
              className="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
