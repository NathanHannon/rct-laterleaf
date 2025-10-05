import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faPause,
    faStop,
    faVolumeUp,
    faSpinner,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import './ArticleAudioPlayer.scss';

interface Voice {
    name: string;
    displayName: string;
    languageCode: string;
    ssmlGender: string;
}

interface ArticleAudioPlayerProps {
    articleId: string;
    content: string;
    title?: string;
}

const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({
    articleId,
    content,
    title
}) => {
    const { getToken } = useAuth();
    const audioRef = useRef<HTMLAudioElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Fetch available voices on component mount
    useEffect(() => {
        fetchAvailableVoices();
    }, []);

    // Update current time during playback
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnd = () => setIsPlaying(false);
        const handleError = () => {
            setError('Audio playback failed');
            setIsPlaying(false);
            setIsLoading(false);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnd);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnd);
            audio.removeEventListener('error', handleError);
        };
    }, [audioUrl]);

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const fetchAvailableVoices = async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/articles/voices', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const voices = await response.json();
                setAvailableVoices(voices);
                if (voices.length > 0 && !selectedVoice) {
                    setSelectedVoice(voices[0].name);
                }
            }
        } catch (error) {
            console.error('Failed to fetch voices:', error);
        }
    };

    const generateAudio = async () => {
        if (!content?.trim()) {
            setError('No content available for audio generation');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/audio`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    voice: selectedVoice || undefined,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Audio generation failed: ${errorText}`);
            }

            const audioBlob = await response.blob();
            const url = URL.createObjectURL(audioBlob);

            // Clean up previous URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }

            setAudioUrl(url);

            // Set audio source and load
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.load();
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to generate audio');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayPause = async () => {
        if (!audioUrl) {
            await generateAudio();
            return;
        }

        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch {
                setError('Failed to play audio');
                setIsPlaying(false);
            }
        }
    };

    const handleStop = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(event.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        const newVolume = parseFloat(event.target.value);

        setVolume(newVolume);
        if (audio) {
            audio.volume = newVolume;
        }
    };

    const handlePlaybackRateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const audio = audioRef.current;
        const newRate = parseFloat(event.target.value);

        setPlaybackRate(newRate);
        if (audio) {
            audio.playbackRate = newRate;
        }
    };

    const formatTime = (time: number): string => {
        if (!isFinite(time)) return '0:00';

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Don't render if no content
    if (!content?.trim()) {
        return null;
    }

    return (
        <div className="article-audio-player">
            <audio
                ref={audioRef}
                preload="metadata"
                style={{ display: 'none' }}
            />

            <div className="audio-header">
                <h4>Listen to Article</h4>
                {title && <span className="audio-title">{title}</span>}
            </div>

            {error && (
                <div className="audio-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                </div>
            )}

            <div className="audio-controls">
                <div className="primary-controls">
                    <button
                        className="control-button play-pause"
                        onClick={handlePlayPause}
                        disabled={isLoading}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                        )}
                    </button>

                    <button
                        className="control-button stop"
                        onClick={handleStop}
                        disabled={!audioUrl || isLoading}
                        aria-label="Stop"
                    >
                        <FontAwesomeIcon icon={faStop} />
                    </button>
                </div>

                <div className="progress-controls">
                    <span className="time-display current-time">
                        {formatTime(currentTime)}
                    </span>

                    <input
                        type="range"
                        className="progress-slider"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={!audioUrl}
                        aria-label="Seek"
                    />

                    <span className="time-display duration">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            <div className="audio-settings">
                <div className="setting-group">
                    <label htmlFor="voice-select">Voice:</label>
                    <select
                        id="voice-select"
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        disabled={isLoading || isPlaying}
                    >
                        {availableVoices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                                {voice.displayName} ({voice.languageCode})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="setting-group">
                    <label htmlFor="playback-rate">Speed:</label>
                    <select
                        id="playback-rate"
                        value={playbackRate}
                        onChange={handlePlaybackRateChange}
                        disabled={!audioUrl}
                    >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                    </select>
                </div>

                <div className="setting-group volume-group">
                    <FontAwesomeIcon icon={faVolumeUp} />
                    <input
                        type="range"
                        className="volume-slider"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        aria-label="Volume"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="loading-message">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Generating audio...</span>
                </div>
            )}
        </div>
    );
};

export default ArticleAudioPlayer;