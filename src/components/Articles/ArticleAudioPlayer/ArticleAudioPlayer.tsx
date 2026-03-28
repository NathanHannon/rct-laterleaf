import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "@clerk/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faSpinner, faCog, faRedo, faRotateLeft, faRotateRight, faTimes, faDownload, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import WaveformAnimation from '../../Common/WaveformAnimation/WaveformAnimation';
import './ArticleAudioPlayer.scss';

interface ArticleAudioPlayerProps {
    articleId: string;
    content: string;
    audioLocation?: string;
    className?: string;
    onClose?: () => void;
}

interface TTSVoice {
    voice: string;
    description: string;
    recommended: string;
}

const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({
    articleId,
    content,
    audioLocation,
    className = '',
    onClose
}) => {
    const { getToken } = useAuth();
    const audioRef = useRef<HTMLAudioElement>(null);

    // Audio state
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(audioLocation || null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Audio controls
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(audioLocation || null); // Initialize with prop
    const [speed, setSpeed] = useState(1.0);
    const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
    const [showWaveform, setShowWaveform] = useState(() => {
        const saved = localStorage.getItem('laterleaf_show_waveform');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const skipBackward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
        }
    };

    const skipForward = () => {
        if (audioRef.current) {
            const d = audioRef.current.duration || duration;
            audioRef.current.currentTime = Math.min(d, audioRef.current.currentTime + 10);
        }
    };

    // Remove verbose event listeners since we use React props on <audio> now
    // But we still need to manage speed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, [speed, audioUrl]);

    // Handle audioLocation prop changes
    useEffect(() => {
        if (audioLocation) {
            setAudioUrl(audioLocation);
            setDownloadUrl(audioLocation);
        }
    }, [audioLocation]);

    // Fetch voices when settings panel opens
    useEffect(() => {
        if (showSettings && availableVoices.length === 0) {
            fetchAvailableVoices();
        }
    }, [showSettings]);

    // Cleanup audio URL on unmount if blob
    useEffect(() => {
        return () => {
            if (audioUrl && audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const fetchAvailableVoices = async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/ai/tts-voices', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const voices = await response.json();
                setAvailableVoices(voices);
                if (voices.length > 0 && !selectedVoice) {
                    // Set default voice - use the first available voice (Puck)
                    setSelectedVoice(voices[0].voice);
                }
            }
        } catch (error) {
            console.error('Failed to fetch voices:', error);
        }
    };

    // Generate Audio Function - Updated to just set URL
    const generateAudio = async () => {
        if (!content?.trim()) {
            setError('No content available for audio generation');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = await getToken();

            // Build query parameters
            const params = new URLSearchParams();
            if (selectedVoice) {
                params.append('voice', selectedVoice);
            }
            if (speed !== 1.0) {
                params.append('speed', speed.toString());
            }

            const queryString = params.toString();
            const url = `/api/articles/${articleId}/audio${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Audio generation failed: ${errorText}`);
            }

            const audioBlob = await response.blob();
            const url2 = URL.createObjectURL(audioBlob);

            // Clean up previous URL if it was a blob URL
            if (audioUrl && audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(audioUrl);
            }

            setAudioUrl(url2);
            // We rely on the src prop update now, but we can force load if needed
            if (audioRef.current) {
                audioRef.current.load();
            }

        } catch (error) {
            console.error('Audio generation error:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate audio');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audioUrl) {
            await generateAudio();
            return;
        }

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch {
                setError('Playback failed');
                setIsPlaying(false);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Don't render if no content
    if (!content?.trim()) {
        return null;
    }

    return (
        <div className={`article-audio-player ${className}`}>
            {showWaveform && <WaveformAnimation isPlaying={isPlaying} className="player-background-waveform" />}

            <div className="player-header">
                <div className="player-title">
                    <div className="icon-wrapper">
                        <FontAwesomeIcon icon={faVolumeUp} />
                    </div>
                    <div>
                        <h4>Read Aloud</h4>
                    </div>
                </div>

                <div className="player-actions">
                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            download={`article-audio-${articleId}.mp3`}
                            className="action-icon-button"
                            title="Download Audio"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                        </a>
                    )}
                    <button
                        className={`action-icon-button settings-toggle ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings(!showSettings)}
                        title={showSettings ? "Hide Settings" : "Audio Settings"}
                    >
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                    {onClose && (
                        <button
                            className="action-icon-button close-button"
                            onClick={onClose}
                            title="Close Player"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    )}
                </div>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl || undefined}
                preload="metadata"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                    setError('Audio playback failed');
                    setIsPlaying(false);
                }}
            />

            {showSettings && (
                <div className="audio-settings-panel">
                    <div className="setting-group">
                        <label>Voice</label>
                        <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            disabled={isLoading}
                        >
                            {availableVoices.map((voice) => (
                                <option key={voice.voice} value={voice.voice}>
                                    {voice.voice}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>Speed</label>
                        <select
                            value={speed}
                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                            disabled={isLoading}
                        >
                            <option value={0.75}>0.75x</option>
                            <option value={1.0}>1.0x</option>
                            <option value={1.25}>1.25x</option>
                            <option value={1.5}>1.5x</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>Waveform</label>
                        <select
                            value={showWaveform ? 'show' : 'hide'}
                            onChange={(e) => {
                                const val = e.target.value === 'show';
                                setShowWaveform(val);
                                localStorage.setItem('laterleaf_show_waveform', JSON.stringify(val));
                            }}
                            disabled={isLoading}
                        >
                            <option value="show">Show</option>
                            <option value="hide">Hide</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="audio-main-row">
                <div className="playback-controls">
                    <button
                        onClick={skipBackward}
                        disabled={isLoading || !audioUrl}
                        className="skip-button"
                        title="Skip Back 10s"
                    >
                        <FontAwesomeIcon icon={faRotateLeft} />
                    </button>

                    <button
                        onClick={togglePlayback}
                        disabled={isLoading}
                        className={`main-play-button ${audioUrl ? 'compact' : ''}`}
                        title={audioUrl ? (isPlaying ? 'Pause' : 'Play') : 'Generate Audio'}
                    >
                        {isLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : isPlaying ? (
                            <FontAwesomeIcon icon={faPause} />
                        ) : (
                            <FontAwesomeIcon icon={audioUrl ? (currentTime >= duration && duration > 0 ? faRedo : faPlay) : faPlay} />
                        )}
                        {!audioUrl && !isLoading && <span className="generate-text">Generate Audio</span>}
                    </button>

                    <button
                        onClick={skipForward}
                        disabled={isLoading || !audioUrl}
                        className="skip-button"
                        title="Skip Forward 10s"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                    </button>
                </div>

                {audioUrl && (
                    <div className="time-display-group">
                        <div className="time-text">
                            <span className="current">{formatTime(currentTime)}</span>
                            <span className="separator">/</span>
                            <span className="total">{formatTime(duration)}</span>
                        </div>
                        <div className="progress-container">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="progress-slider"
                                style={{ '--progress': `${(currentTime / (duration || 1)) * 100}%` } as React.CSSProperties}
                            />
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="audio-error">
                    <small>⚠️ {error}</small>
                </div>
            )}
        </div>
    );
};

export default ArticleAudioPlayer;