import React, { useState } from 'react';
import { useAudio } from '../../../context/useAudio';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faTimes, faChevronUp, faRotateLeft, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import './GlobalAudioPlayer.scss';

const GlobalAudioPlayer: React.FC = () => {
    const { currentTrack, isPlaying, togglePlayback, closePlayer, currentTime, duration, seek, skipBackward, skipForward } = useAudio();
    const location = useLocation();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Hide if no track is playing
    if (!currentTrack) return null;

    // Check if we are on the current track's article page. If so, hide the global player
    // to let the inline ArticleAudioPlayer take over the UI.
    const isOnArticlePage = location.pathname === `/article/${currentTrack.id}`;
    if (isOnArticlePage) return null;

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(parseFloat(e.target.value));
    };

    const navigateToArticle = (e: React.MouseEvent) => {
        // Prevent expanding the player or clicking through controls
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
            return;
        }
        navigate(`/article/${currentTrack.id}`);
    };

    return (
        <div className={`global-audio-player ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="mini-player-content" onClick={navigateToArticle}>

                {/* Expand Toggle (Desktop usually keeps it collapsed or expands a side panel) */}
                <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} aria-label="Toggle Player Size">
                    <FontAwesomeIcon icon={faChevronUp} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                <div className="track-info">
                    <h4 className="track-title">{currentTrack.title}</h4>
                    <span className="track-artist">{currentTrack.artist || 'LaterLeaf AI'}</span>
                </div>

                <div className="playback-controls">
                    <button onClick={(e) => { e.stopPropagation(); skipBackward(); }} className="skip-btn" aria-label="Skip backward">
                        <FontAwesomeIcon icon={faRotateLeft} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
                        className="play-pause-btn"
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); skipForward(); }} className="skip-btn" aria-label="Skip forward">
                        <FontAwesomeIcon icon={faRotateRight} />
                    </button>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                    className="close-btn"
                    aria-label="Close player"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            {isExpanded && (
                <div className="expanded-controls">
                    <div className="time-info">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="seek-slider"
                    />
                </div>
            )}

            {/* The progress bar is always visible at the top/bottom boundary even when collapsed */}
            {!isExpanded && duration > 0 && (
                <div className="mini-progress-bar">
                    <div
                        className="mini-progress-fill"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default GlobalAudioPlayer;
