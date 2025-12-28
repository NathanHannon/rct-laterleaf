import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faSpinner, faCog } from '@fortawesome/free-solid-svg-icons';
import { useUserStatus } from '../../../hooks/useUserStatus';
import WaveformAnimation from '../../Common/WaveformAnimation/WaveformAnimation';
import './ArticleAudioPlayer.scss';

interface ArticleAudioPlayerProps {
    articleId: string;
    content: string;
    className?: string;
}

interface TTSVoice {
    voice: string;
    description: string;
    recommended: string;
}

const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({
    articleId,
    content,
    className = ''
}) => {
    const { getToken } = useAuth();
    const { isPro } = useUserStatus();
    const audioRef = useRef<HTMLAudioElement>(null);

    // Audio state
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Audio controls
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [speed, setSpeed] = useState(1.0);
    const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
    const [showWaveform, setShowWaveform] = useState(() => {
        const saved = localStorage.getItem('laterleaf_show_waveform');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Sync with global settings
    useEffect(() => {
        const handleSettingsChange = () => {
            const saved = localStorage.getItem('laterleaf_show_waveform');
            setShowWaveform(saved !== null ? JSON.parse(saved) : true);
        };
        window.addEventListener('laterleaf_waveform_settings_changed', handleSettingsChange);
        return () => window.removeEventListener('laterleaf_waveform_settings_changed', handleSettingsChange);
    }, []);

    const handleToggleWaveform = (value: boolean) => {
        setShowWaveform(value);
        localStorage.setItem('laterleaf_show_waveform', JSON.stringify(value));
        window.dispatchEvent(new Event('laterleaf_waveform_settings_changed'));
    };

    // Fetch available voices on component mount
    useEffect(() => {
        fetchAvailableVoices();
    }, []);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnd = () => setIsPlaying(false);
        const handleError = () => {
            setError('Audio playback failed');
            setIsPlaying(false);
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

            // Clean up previous URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }

            setAudioUrl(url2);

            // Set audio source and load
            if (audioRef.current) {
                audioRef.current.src = url2;
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
            <audio ref={audioRef} preload="metadata" />

            <div className="audio-controls">
                <div className="primary-controls">
                    <button
                        onClick={togglePlayback}
                        disabled={isLoading}
                        className="play-button"
                        title={audioUrl ? (isPlaying ? 'Pause' : 'Play') : 'Generate Audio'}
                    >
                        {isLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : isPlaying ? (
                            <FontAwesomeIcon icon={faPause} />
                        ) : (
                            <FontAwesomeIcon icon={faPlay} />
                        )}
                    </button>

                    <div className="audio-info">
                        <div className="time-display">
                            {audioUrl ? (
                                <>
                                    <span>{formatTime(currentTime)}</span>
                                    <span>/</span>
                                    <span>{formatTime(duration)}</span>
                                </>
                            ) : (
                                <span>Listen to article</span>
                            )}
                        </div>
                        {!isPro && availableVoices.length > 0 && (
                            <div className="tier-info">
                                <small>🎵 Free tier - {availableVoices.length} voices available</small>
                            </div>
                        )}
                        {isPro && availableVoices.length > 0 && (
                            <div className="tier-info">
                                <small>✨ Pro tier - {availableVoices.length} premium voices available</small>
                            </div>
                        )}
                    </div>
                </div>

                {audioUrl && (
                    <div className="progress-controls">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="progress-slider"
                        />
                    </div>
                )}

                <div className="audio-settings">
                    {/* Voice Selection */}
                    {availableVoices.length > 0 && (
                        <div className="voice-selector">
                            <select
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                                disabled={isLoading}
                            >
                                {availableVoices.map((voice) => (
                                    <option key={voice.voice} value={voice.voice}>
                                        {voice.voice} - {voice.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Speed Control */}
                    <div className="speed-controls">
                        <label>Speed:</label>
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

                    {/* Waveform Toggle */}
                    <div className="waveform-control">
                        <label>Waveform:</label>
                        <select
                            value={showWaveform ? 'show' : 'hide'}
                            onChange={(e) => handleToggleWaveform(e.target.value === 'show')}
                            disabled={isLoading}
                        >
                            <option value="show">Show</option>
                            <option value="hide">Hide</option>
                        </select>
                    </div>

                    {/* Regenerate Button */}
                    {audioUrl && (
                        <button
                            onClick={generateAudio}
                            disabled={isLoading}
                            className="regenerate-button"
                            title="Regenerate with current settings"
                        >
                            🔄
                        </button>
                    )}
                </div>
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