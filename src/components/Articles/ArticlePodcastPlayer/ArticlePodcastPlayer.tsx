import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faSpinner, faPodcast, faCog } from '@fortawesome/free-solid-svg-icons';
import { useUserStatus } from '../../../hooks/useUserStatus';
import './ArticlePodcastPlayer.scss';

interface ArticlePodcastPlayerProps {
    articleId: string;
    title: string;
    className?: string;
}

interface TTSVoice {
    voice: string;
    description: string;
    recommended: string;
}

const ArticlePodcastPlayer: React.FC<ArticlePodcastPlayerProps> = ({ 
    articleId, 
    title,
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
    
    // Podcast settings
    const [showSettings, setShowSettings] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
    const [hostVoice, setHostVoice] = useState<string>('Puck');
    const [expertVoice, setExpertVoice] = useState<string>('Charon');
    const [podcastDuration, setPodcastDuration] = useState<'short' | 'medium' | 'long'>('medium');
    const [podcastStyle, setPodcastStyle] = useState<'casual' | 'professional' | 'educational'>('casual');
    const [speed, setSpeed] = useState(1.0);

    // Podcast metadata
    const [podcastInfo, setPodcastInfo] = useState<{
        segments: number;
        estimatedDuration: number;
    } | null>(null);

    // Fetch available voices on component mount
    useEffect(() => {
        fetchAvailableVoices();
    }, [fetchAvailableVoices]);

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

    const fetchAvailableVoices = useCallback(async () => {
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
                
                // Set default voices if available
                if (voices.length >= 2) {
                    setHostVoice(voices[0].voice); // First available voice
                    setExpertVoice(voices[1].voice); // Second available voice
                }
            }
        } catch (error) {
            console.error('Failed to fetch voices:', error);
        }
    }, [getToken]);

    const generatePodcast = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = await getToken();
            
            // Build query parameters
            const params = new URLSearchParams();
            if (hostVoice) params.append('hostVoice', hostVoice);
            if (expertVoice) params.append('expertVoice', expertVoice);
            if (podcastDuration) params.append('duration', podcastDuration);
            if (podcastStyle) params.append('style', podcastStyle);
            if (speed !== 1.0) params.append('speed', speed.toString());
            
            const queryString = params.toString();
            const url = `/api/articles/${articleId}/podcast-audio${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Podcast generation failed: ${errorText}`);
            }

            // Extract metadata from headers
            const segments = response.headers.get('X-Script-Segments');
            const estimatedDuration = response.headers.get('X-Podcast-Duration');
            
            if (segments && estimatedDuration) {
                setPodcastInfo({
                    segments: parseInt(segments, 10),
                    estimatedDuration: parseInt(estimatedDuration, 10)
                });
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Clean up previous URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }

            setAudioUrl(audioUrl);

            // Set audio source and load
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.load();
            }

        } catch (error) {
            console.error('Podcast generation error:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate podcast');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audioUrl) {
            await generatePodcast();
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

    const getDurationLabel = () => {
        switch (podcastDuration) {
            case 'short': return '3-5 min';
            case 'medium': return '7-10 min';
            case 'long': return '15+ min';
            default: return '';
        }
    };

    return (
        <div className={`article-podcast-player ${className}`}>
            <audio ref={audioRef} preload="metadata" />
            
            <div className="podcast-header">
                <div className="podcast-info">
                    <h4>
                        <FontAwesomeIcon icon={faPodcast} />
                        AI Podcast Discussion
                    </h4>
                    <p>Two-speaker conversation about: "{title}"</p>
                    {podcastInfo && (
                        <div className="podcast-metadata">
                            <small>
                                {podcastInfo.segments} segments • ~{Math.round(podcastInfo.estimatedDuration / 60)} min
                            </small>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="settings-toggle"
                    title="Podcast Settings"
                >
                    <FontAwesomeIcon icon={faCog} />
                </button>
            </div>

            {showSettings && (
                <div className="podcast-settings">
                    <div className="setting-group">
                        <label>Duration:</label>
                        <select
                            value={podcastDuration}
                            onChange={(e) => setPodcastDuration(e.target.value as 'short' | 'medium' | 'long')}
                            disabled={isLoading}
                        >
                            <option value="short">Short (3-5 min)</option>
                            <option value="medium">Medium (7-10 min)</option>
                            <option value="long">Long (15+ min)</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>Style:</label>
                        <select
                            value={podcastStyle}
                            onChange={(e) => setPodcastStyle(e.target.value as 'casual' | 'professional' | 'educational')}
                            disabled={isLoading}
                        >
                            <option value="casual">Casual</option>
                            <option value="professional">Professional</option>
                            <option value="educational">Educational</option>
                        </select>
                    </div>

                    {availableVoices.length >= 2 && (
                        <>
                            <div className="setting-group">
                                <label>Host Voice:</label>
                                <select
                                    value={hostVoice}
                                    onChange={(e) => setHostVoice(e.target.value)}
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
                                <label>Expert Voice:</label>
                                <select
                                    value={expertVoice}
                                    onChange={(e) => setExpertVoice(e.target.value)}
                                    disabled={isLoading}
                                >
                                    {availableVoices.map((voice) => (
                                        <option key={voice.voice} value={voice.voice}>
                                            {voice.voice}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="setting-group">
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
                </div>
            )}

            <div className="podcast-controls">
                <div className="primary-controls">
                    <button
                        onClick={togglePlayback}
                        disabled={isLoading}
                        className="play-button"
                        title={audioUrl ? (isPlaying ? 'Pause' : 'Play') : `Generate ${getDurationLabel()} Podcast`}
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
                                <span>Generate podcast discussion ({getDurationLabel()})</span>
                            )}
                        </div>
                        <div className="tier-info">
                            <small>
                                🎙️ {isPro ? 'Pro tier - All voices' : 'Free tier - Basic voices'} • 
                                HOST: {hostVoice} + EXPERT: {expertVoice}
                            </small>
                        </div>
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

                {audioUrl && (
                    <button
                        onClick={generatePodcast}
                        disabled={isLoading}
                        className="regenerate-button"
                        title="Regenerate with current settings"
                    >
                        🔄 Regenerate
                    </button>
                )}
            </div>

            {error && (
                <div className="podcast-error">
                    <small>⚠️ {error}</small>
                </div>
            )}
        </div>
    );
};

export default ArticlePodcastPlayer;