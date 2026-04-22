import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faSpinner, faCog, faRedo, faRotateLeft, faRotateRight, faTimes, faDownload, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { useAudio } from '../../../context/useAudio';
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

    // Global Audio state
    const { currentTrack, isPlaying, playTrack, togglePlayback: globalTogglePlayback, currentTime, duration, seek, skipForward, skipBackward, setPlaybackRate } = useAudio();

    // Local component state
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(audioLocation || null);
    const [prefetchedDuration, setPrefetchedDuration] = useState(0);

    // Audio controls
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(audioLocation || null);
    const [speed, setSpeed] = useState(1.0);
    const [showWaveform, setShowWaveform] = useState(() => {
        const saved = localStorage.getItem('laterleaf_show_waveform');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const { data: availableVoices = [] } = useQuery({
        queryKey: ['tts-voices'],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch('/api/ai/tts-voices', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) return [];
            return response.json() as Promise<TTSVoice[]>;
        },
        enabled: showSettings,
        staleTime: Infinity,
    });

    // Set default voice when voices load
    useEffect(() => {
        if (availableVoices.length > 0 && !selectedVoice) {
            setSelectedVoice(availableVoices[0].voice);
        }
    }, [availableVoices, selectedVoice]);

    // Handle audioLocation prop changes
    useEffect(() => {
        if (audioLocation) {
            setAudioUrl(audioLocation);
            setDownloadUrl(audioLocation);
        }
    }, [audioLocation]);

    // Prefetch audio duration so it shows before the user presses play
    useEffect(() => {
        if (!audioUrl) return;
        const tempAudio = new Audio();
        tempAudio.preload = 'metadata';
        tempAudio.src = audioUrl;
        const onMetadata = () => setPrefetchedDuration(tempAudio.duration || 0);
        tempAudio.addEventListener('loadedmetadata', onMetadata);
        return () => {
            tempAudio.removeEventListener('loadedmetadata', onMetadata);
            tempAudio.src = '';
        };
    }, [audioUrl]);

    // Sync speed with global player
    useEffect(() => {
        if (currentTrack?.id === articleId) {
            setPlaybackRate(speed);
        }
    }, [speed, currentTrack?.id]);

    const generateAudioMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const params = new URLSearchParams();
            if (selectedVoice) params.append('voice', selectedVoice);
            if (speed !== 1.0) params.append('speed', speed.toString());
            const queryString = params.toString();
            const url = `/api/articles/${articleId}/audio${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Audio generation failed: ${errorText}`);
            }

            return response.blob();
        },
        onSuccess: (audioBlob) => {
            const url2 = URL.createObjectURL(audioBlob);
            setAudioUrl(url2);
            playTrack({ id: articleId, url: url2, title: 'Read Aloud' });
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : 'Failed to generate audio');
        },
    });

    const isLoading = generateAudioMutation.isPending;

    // Is this article currently the active track in global player?
    const isThisTrackPlaying = currentTrack?.id === articleId && isPlaying;
    const isThisTrackLoaded = currentTrack?.id === articleId;

    const togglePlayback = async () => {
        if (!audioUrl) {
            if (!content?.trim()) {
                setError('No content available for audio generation');
                return;
            }
            generateAudioMutation.mutate();
            return;
        }

        if (isThisTrackLoaded) {
            globalTogglePlayback();
        } else {
            playTrack({ id: articleId, url: audioUrl, title: 'Read Aloud' });
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isThisTrackLoaded) return;
        const newTime = parseFloat(e.target.value);
        seek(newTime);
    };

    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        if (isThisTrackLoaded) {
            setPlaybackRate(newSpeed);
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
            {showWaveform && isThisTrackPlaying && <WaveformAnimation isPlaying={true} className="player-background-waveform" />}

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
                        title={audioUrl ? (isThisTrackPlaying ? 'Pause' : 'Play') : 'Generate Audio'}
                    >
                        {isLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : isThisTrackPlaying ? (
                            <FontAwesomeIcon icon={faPause} />
                        ) : (
                            <FontAwesomeIcon icon={audioUrl && isThisTrackLoaded ? (currentTime >= duration && duration > 0 ? faRedo : faPlay) : faPlay} />
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
                            <span className="current">{formatTime(isThisTrackLoaded ? currentTime : 0)}</span>
                            <span className="separator">/</span>
                            <span className="total">{formatTime(isThisTrackLoaded ? duration : prefetchedDuration)}</span>
                        </div>
                        <div className="progress-container">
                            <input
                                type="range"
                                min="0"
                                max={(isThisTrackLoaded ? duration : 0) || 0}
                                value={isThisTrackLoaded ? currentTime : 0}
                                onChange={handleSeek}
                                disabled={!isThisTrackLoaded}
                                className="progress-slider"
                                style={{ '--progress': `${((isThisTrackLoaded ? currentTime : 0) / ((isThisTrackLoaded ? duration : 0) || 1)) * 100}%` } as React.CSSProperties}
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