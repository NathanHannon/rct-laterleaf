import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faSpinner, faPodcast, faCog, faRotateLeft, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { useUserStatus } from '../../../hooks/useUserStatus';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import './ArticlePodcastPlayer.scss';

interface VoicePair {
    speaker1: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
    speaker2: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
    label: string;
    description: string;
}

interface ArticlePodcastPlayerProps {
    articleId: string;
    title: string;
    className?: string;
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
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Podcast settings - Simplified for fixed backend voices
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [podcastDuration, setPodcastDuration] = useState<'short' | 'medium' | 'long'>('medium');
    const [podcastStyle, setPodcastStyle] = useState<'casual' | 'professional' | 'educational'>('casual');
    const [selectedVoicePair, setSelectedVoicePair] = useState<string>('zephyr-charon');
    const [speed, setSpeed] = useState(1.0);

    // Available voice pairs for podcast conversations
    const voicePairs: VoicePair[] = [
        {
            speaker1: 'Zephyr',
            speaker2: 'Charon',
            label: 'Zephyr & Charon (Default)',
            description: 'Bright & Informative - Great balance for discussions'
        },
        {
            speaker1: 'Puck',
            speaker2: 'Kore',
            label: 'Puck & Kore',
            description: 'Expressive & Warm - Engaging and friendly'
        },
        {
            speaker1: 'Charon',
            speaker2: 'Fenrir',
            label: 'Charon & Fenrir',
            description: 'Clear & Authoritative - Professional discussions'
        },
        {
            speaker1: 'Puck',
            speaker2: 'Charon',
            label: 'Puck & Charon',
            description: 'Dynamic & Clear - Energetic conversations'
        },
        {
            speaker1: 'Kore',
            speaker2: 'Fenrir',
            label: 'Kore & Fenrir',
            description: 'Friendly & Professional - Balanced approach'
        }
    ];

    // Check for existing podcast on component mount
    const checkPodcastStatus = useCallback(async () => {
        console.log(`🎙️ Checking podcast status for article ${articleId}`);
        setIsLoading(true); // Set loading true at the start of the check
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/podcast-status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log(`📊 Podcast status response:`, response.status, response.ok);

            if (response.ok) {
                const status = await response.json();
                console.log(`📋 Podcast status data:`, status);

                if (status.hasAudio && status.audioLocation) {
                    console.log(`🎵 Found existing audio URL: ${status.audioLocation}`);
                    setAudioUrl(status.audioLocation);

                    // Set up audio element
                    if (audioRef.current) {
                        audioRef.current.src = status.audioLocation;
                        audioRef.current.load();
                        console.log(`🔊 Audio element configured with URL`);
                    }
                } else {
                    console.log(`❌ No audio found for this article`);
                    setAudioUrl(null); // Explicitly set to null if no audio
                }
            } else {
                console.warn(`⚠️ Failed to check podcast status:`, response.status);
                setAudioUrl(null);
            }
        } catch (error) {
            console.error('❌ Error checking podcast status:', error);
            setAudioUrl(null);
        } finally {
            setIsLoading(false); // Set loading false at the end
        }
    }, [articleId, getToken]);

    useEffect(() => {
        checkPodcastStatus();
    }, [checkPodcastStatus]);    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
            updateProgressFill(audio.currentTime, audio.duration);
        };
        const updateDuration = () => {
            setDuration(audio.duration);
            updateProgressFill(audio.currentTime, audio.duration);
        };
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

    const generatePodcast = async (forceRegenerate = false) => {
        console.log(`🎙️ generatePodcast started for article ${articleId}, force: ${forceRegenerate}`);
        console.log(`👤 Pro status: ${isPro}`);

        // Check Pro status first
        if (!isPro) {
            const errorMsg = 'Podcast generation is a Pro-only feature. Please upgrade to access multi-speaker audio generation.';
            console.warn(`⚠️ ${errorMsg}`);
            setError(errorMsg);
            alert(errorMsg); // Add alert to make the error more visible
            return;
        }

        setIsLoading(true);
        setError(null);
        console.log(`⏳ Starting podcast generation...`);

        try {
            const token = await getToken();
            console.log(`🔑 Got auth token`);

            // Build query parameters - include voice selection
            const params = new URLSearchParams();
            if (podcastDuration) params.append('duration', podcastDuration);
            if (podcastStyle) params.append('style', podcastStyle);
            if (selectedVoicePair) params.append('voices', selectedVoicePair);
            if (forceRegenerate) params.append('force', 'true'); // Add force parameter

            const queryString = params.toString();
            const url = `/api/articles/${articleId}/podcast-audio${queryString ? `?${queryString}` : ''}`;

            console.log(`🌐 Making request to: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log(`📡 Response status: ${response.status}, ok: ${response.ok}`);
            console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Request failed:`, errorText);
                if (response.status === 402) {
                    throw new Error('Podcast generation requires a Pro subscription. Please upgrade to access this feature.');
                }
                throw new Error(`Podcast generation failed: ${errorText}`);
            }

            // Handle redirect response (cached audio exists via proxy)
            if (response.redirected || response.url !== url) {
                console.log(`🔄 Got redirect to: ${response.url}`);
                const proxyUrl = response.url;
                console.log(`🎯 Setting audioUrl to proxy URL: ${proxyUrl}`);
                setAudioUrl(proxyUrl);

                // Set audio source and load
                if (audioRef.current) {
                    console.log(`🔊 Setting audio src to proxy URL`);
                    audioRef.current.src = proxyUrl;
                    audioRef.current.load();
                }
                console.log(`✅ Proxy URL handling complete, audioUrl should be: ${proxyUrl}`);
                console.log(`✅ Podcast generation completed successfully (from proxy)`);
                return;
            }

            // Handle blob response (new audio generation)
            console.log(`📦 Got blob response, creating object URL`);
            const audioBlob = await response.blob();
            console.log(`📦 Audio blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

            const newAudioUrl = URL.createObjectURL(audioBlob);
            console.log(`🔗 Created object URL: ${newAudioUrl}`);

            // Clean up previous URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }

            console.log(`🎯 Setting audioUrl to blob URL: ${newAudioUrl}`);
            setAudioUrl(newAudioUrl);

            // Set audio source and load
            if (audioRef.current) {
                console.log(`🔊 Setting audio src to blob URL`);
                audioRef.current.src = newAudioUrl;
                audioRef.current.load();
            }
            console.log(`✅ Blob handling complete, audioUrl should be: ${newAudioUrl}`);

            console.log(`✅ Podcast generation completed successfully`);
            console.log(`🎵 Final audioUrl state: ${audioUrl}`);

            // Force a state check to ensure UI updates
            setTimeout(() => {
                console.log(`🔍 Post-generation state check - audioUrl: ${audioUrl}`);
                if (!audioUrl) {
                    console.warn('⚠️ AudioUrl is still null after generation - checking status...');
                    checkPodcastStatus();
                }
            }, 100);

        } catch (error) {
            console.error('❌ Podcast generation error:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate podcast');
        } finally {
            setIsLoading(false);
            console.log(`🏁 Podcast generation process finished`);
        }
    };

    const togglePlayback = async () => {
        console.log(`🎵 togglePlayback called - audioUrl: ${audioUrl}, isPlaying: ${isPlaying}`);

        const audio = audioRef.current;
        if (!audio || !audioUrl) {
            console.error('❌ No audio element or URL available', { audio: !!audio, audioUrl });
            setError('No audio available for playback');
            return;
        }

        console.log(`🔊 Audio element state:`, {
            src: audio.src,
            readyState: audio.readyState,
            currentTime: audio.currentTime,
            duration: audio.duration
        });

        if (isPlaying) {
            console.log(`⏸️ Pausing audio`);
            audio.pause();
            setIsPlaying(false);
        } else {
            try {
                console.log(`▶️ Attempting to play audio`);
                await audio.play();
                setIsPlaying(true);
                console.log(`✅ Audio playback started successfully`);
            } catch (err) {
                console.error('❌ Playback error:', err);
                setError('Audio playback failed');
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
        updateProgressFill(newTime, duration);
    };

    const deletePodcast = async () => {
        setIsLoading(true);
        setError(null);
        console.log(`🗑️ Deleting podcast for article ${articleId}`);

        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/podcast-audio`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete podcast: ${errorText}`);
            }

            console.log(`✅ Podcast deleted successfully`);

            // Clear local state
            setAudioUrl(null);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            setShowDeleteConfirm(false);

            // Clear audio element
            if (audioRef.current) {
                audioRef.current.src = '';
                audioRef.current.load();
            }

        } catch (err) {
            console.error('Delete failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete podcast');
        } finally {
            setIsLoading(false);
        }
    };

    const skipForward = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.min(audio.currentTime + 10, audio.duration || 0);
    };

    const skipBackward = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(audio.currentTime - 10, 0);
    };

    // Update progress fill dynamically
    const updateProgressFill = (currentTime: number, duration: number) => {
        const progressSlider = document.querySelector('.progress-slider') as HTMLElement;
        if (progressSlider && duration > 0) {
            const progress = (currentTime / duration) * 100;
            progressSlider.style.setProperty('--progress', `${progress}%`);
        }
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

    return (
        <div className={`article-podcast-player ${className}`}>
            <audio ref={audioRef} preload="metadata" />

            <div className="podcast-header">
                <div className="podcast-info">
                    <h4>
                        <FontAwesomeIcon icon={faPodcast} />
                        AI Podcast Discussion
                    </h4>
                    <p>Podcast-style conversation about: "{title}"</p>
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

                    <div className="setting-group">
                        <label>Voice Pair:</label>
                        <select
                            value={selectedVoicePair}
                            onChange={(e) => setSelectedVoicePair(e.target.value)}
                            disabled={isLoading}
                        >
                            {voicePairs.map((pair, index) => (
                                <option key={index} value={`${pair.speaker1.toLowerCase()}-${pair.speaker2.toLowerCase()}`}>
                                    {pair.label}
                                </option>
                            ))}
                        </select>
                        <small className="voice-description">
                            {voicePairs.find(p => `${p.speaker1.toLowerCase()}-${p.speaker2.toLowerCase()}` === selectedVoicePair)?.description}
                        </small>
                    </div>

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
                    {!isPro ? (
                        <div className="pro-required">
                            <div className="upgrade-message">
                                🎙️ Pro Required for Podcasts - Multi-speaker audio generation requires a Pro subscription
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="loading-container">
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Checking for existing podcast...</span>
                        </div>
                    ) : audioUrl ? (
                        <div className="playback-controls">
                            <button
                                onClick={skipBackward}
                                disabled={!audioUrl}
                                className="skip-button skip-backward"
                                title="Skip backward 10s"
                            >
                                <FontAwesomeIcon icon={faRotateLeft} />
                            </button>
                            <button
                                onClick={togglePlayback}
                                className="play-button"
                                title={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? (
                                    <FontAwesomeIcon icon={faPause} />
                                ) : (
                                    <FontAwesomeIcon icon={faPlay} />
                                )}
                            </button>
                            <button
                                onClick={skipForward}
                                disabled={!audioUrl}
                                className="skip-button skip-forward"
                                title="Skip forward 10s"
                            >
                                <FontAwesomeIcon icon={faRotateRight} />
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="new-podcast-button"
                                title="Delete podcast and clear from storage"
                            >
                                🗑️ Delete Podcast
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => generatePodcast(false)}
                            className="generate-btn"
                        >
                            <FontAwesomeIcon icon={faPodcast} />
                            <span>Generate Podcast</span>
                        </button>
                    )}

                    <div className="audio-info">
                        <div className="time-display">
                            {audioUrl ? (
                                <>
                                    <span>{formatTime(currentTime)}</span>
                                    <span>/</span>
                                    <span>{formatTime(duration)}</span>
                                </>
                            ) : isPro ? (
                                <span>Ready to generate podcast discussion</span>
                            ) : (
                                <span>Pro subscription required for podcast generation</span>
                            )}
                        </div>
                        <div className="tier-info">
                            <small>
                                🎙️ {isPro ? 'Pro Feature - Premium Quality' : 'Requires Pro Subscription'} •
                                Multiple voice pairs available
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
            </div>

            {error && audioUrl && (
                <div className="podcast-error">
                    <small>⚠️ {error}</small>
                </div>
            )}

            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                title="Delete Podcast"
                message="Are you sure you want to delete this podcast? This action cannot be undone and will remove the audio file from storage."
                confirmText={isLoading ? 'Deleting...' : 'Delete Podcast'}
                cancelText="Cancel"
                variant="danger"
                onConfirm={deletePodcast}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};

export default ArticlePodcastPlayer;