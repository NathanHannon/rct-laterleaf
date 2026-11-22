import React from 'react';
import { useAudio } from '../../../context/useAudio';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faRotateLeft, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import './GlobalAudioPlayer.scss';

const GlobalAudioPlayer: React.FC = () => {
    const { currentTrack, isPlaying, togglePlayback, closePlayer, currentTime, duration, seek, skipBackward, skipForward } = useAudio();
    const location = useLocation();
    const navigate = useNavigate();

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Hide if no track is playing
    if (!currentTrack) return null;

    // Hide on the active track's article page so the in-reader player handles controls
    const isOnArticlePage = location.pathname === `/article/${currentTrack.id}`;
    if (isOnArticlePage) return null;

    const isPodcast = (currentTrack.artist || '').toLowerCase().includes('podcast');
    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(parseFloat(e.target.value));
    };

    const navigateToArticle = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
            return;
        }
        navigate(`/article/${currentTrack.id}`);
    };

    return (
        <div
            className={`global-audio-player ${isPodcast ? 'is-podcast' : ''}`}
            onClick={navigateToArticle}
            role="region"
            aria-label="Audio player"
        >
            <div className="global-player-transport">
                <button
                    onClick={(e) => { e.stopPropagation(); skipBackward(); }}
                    className="bar-icon-btn"
                    title="Skip backward 10s"
                    aria-label="Skip backward 10s"
                >
                    <FontAwesomeIcon icon={faRotateLeft} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
                    className="bar-play-btn"
                    title={isPlaying ? 'Pause' : 'Play'}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); skipForward(); }}
                    className="bar-icon-btn"
                    title="Skip forward 10s"
                    aria-label="Skip forward 10s"
                >
                    <FontAwesomeIcon icon={faRotateRight} />
                </button>
            </div>

            <div className="global-player-center">
                <div className="global-player-meta">
                    <span className="track-title" title={currentTrack.title}>
                        {currentTrack.title}
                    </span>
                </div>
                <div className="global-player-scrubber">
                    <span className="bar-time">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={!duration}
                        className="progress-slider"
                        style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
                        aria-label="Seek audio"
                    />
                    <span className="bar-time">{formatTime(duration)}</span>
                </div>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                className="bar-icon-btn close-btn"
                title="Close player"
                aria-label="Close player"
            >
                ✕
            </button>
        </div>
    );
};

export default GlobalAudioPlayer;
