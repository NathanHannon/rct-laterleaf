import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faSpinner, faPodcast, faCog, faRotateLeft, faRotateRight, faRedo, faDownload } from '@fortawesome/free-solid-svg-icons';
import { useUserStatus } from '../../../hooks/useUserStatus';
import { useAudio } from '../../../context/audioContext';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import WaveformAnimation from '../../Common/WaveformAnimation/WaveformAnimation';
import { LANGUAGES } from '../../../constants/languages';
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
    onClose?: () => void;
    selectedLanguage?: string;
}

const ArticlePodcastPlayer: React.FC<ArticlePodcastPlayerProps> = ({
    articleId,
    title,
    className,
    onClose,
    selectedLanguage
}) => {
    const { getToken } = useAuth();
    const { isPro } = useUserStatus();
    const queryClient = useQueryClient();

    // Global Audio state
    const { currentTrack, isPlaying, playTrack, togglePlayback: globalTogglePlayback, currentTime, duration, seek, skipForward, skipBackward, setPlaybackRate, closePlayer } = useAudio();

    // Simple local error state (separate from query error)
    const [localError, setLocalError] = useState<string | null>(null);
    const [prefetchedDuration, setPrefetchedDuration] = useState(0);

    // Podcast settings - Simplified for fixed backend voices
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [podcastDuration, setPodcastDuration] = useState<'short' | 'medium' | 'long'>('medium');
    const [selectedVoicePair, setSelectedVoicePair] = useState<string>('zephyr-charon');
    const [speed, setSpeed] = useState(1.0);
    const [showWaveform, setShowWaveform] = useState(() => {
        const saved = localStorage.getItem('laterleaf_show_waveform');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // --- QUERY: Get Podcast Status ---
    const {
        data: podcastStatus,
        isLoading: isQueryLoading,
        error: queryError
    } = useQuery({
        queryKey: ['podcast', articleId],
        queryFn: async () => {
            console.log(`🎙️ Checking podcast status for article ${articleId}`);
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/podcast-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch status');
            return response.json();
        },
        // Poll every 5s ONLY if status is 'pending'
        refetchInterval: (query) => {
            const status = query.state.data;
            if (status?.status === 'pending') return 5000;
            return false;
        }
    });

    // Derived State from Query
    const audioUrl = podcastStatus?.audioUrl || null;
    const isGenerating = podcastStatus?.status === 'pending';
    const isLoading = isQueryLoading || isGenerating;
    const error = localError || (queryError ? (queryError as Error).message : null);

    const isThisTrackPlaying = currentTrack?.id === articleId && isPlaying;
    const isThisTrackLoaded = currentTrack?.id === articleId;

    const handleDownload = async () => {
        if (!audioUrl) return;

        try {
            const token = await getToken();

            // Determine extension from URL (or default to mp3)
            const urlExt = audioUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
            const extension = (urlExt && ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(urlExt)) ? urlExt : 'mp3';

            // Use the Backend Proxy Endpoint
            const response = await fetch(`/api/articles/${articleId}/podcast-download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_overview.${extension}`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download failed:', err);
            // Last resort fallback
            if (audioUrl) window.open(audioUrl, '_blank');
        }
    };

    // Effect: Handle audio URL updates
    useEffect(() => {
        if (podcastStatus?.audioUrl && currentTrack?.id === articleId && isPlaying) {
            // No local effect needed; the global context manages the URL now.
            console.log(`🎵 Found existing audio URL: ${podcastStatus.audioUrl}`);
        }
    }, [podcastStatus?.audioUrl, currentTrack?.id, isPlaying]);

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


    // Check supported languages
    // Allowlist approach is safer than blocklist
    const supportedLanguageCodes = [
        'original', 'en', 'es', 'fr', 'de', 'it', 'pt-BR',
        'nl', 'ru', 'pl', 'tr', 'th', 'vi', 'id', 'ja', 'ko', 'hi'
    ];

    // Explicitly check if the selected language is in our supported list
    const isLanguageSupported = !selectedLanguage || supportedLanguageCodes.includes(selectedLanguage);

    // console.log(`🎙️ Podcast Player Language Check:`, { selectedLanguage, isLanguageSupported });

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

    // Sync speed with global player
    useEffect(() => {
        if (currentTrack?.id === articleId) {
            setPlaybackRate(speed);
        }
    }, [speed, currentTrack?.id]);

    // --- MUTATION: Generate Podcast ---
    const generateMutation = useMutation({
        mutationFn: async (params: { force: boolean, duration: string, voices: string, language?: string, style?: string }) => {
            const token = await getToken();
            const queryParams = new URLSearchParams();
            if (params.duration) queryParams.append('duration', params.duration);
            if (params.voices) {
                queryParams.append('voices', params.voices);
                queryParams.append('personaId', params.voices);
            }
            if (params.style) queryParams.append('style', params.style);
            if (params.language) queryParams.append('language', params.language);
            if (params.force) queryParams.append('force', 'true');

            const url = `/api/articles/${articleId}/podcast-audio?${queryParams.toString()}`;
            console.log(`🌐 generating podcast via: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 402) {
                    throw new Error('Podcast generation requires a Pro subscription.');
                }
                const errText = await response.text();
                throw new Error(errText || 'Generation failed');
            }
            return response.json();
        },
        onSuccess: (data) => {
            console.log(`✅ Generation request successful`, data);
            queryClient.invalidateQueries({ queryKey: ['podcast', articleId] });
            if (data.audioUrl && data.audioUrl !== 'processing') {
                playTrack({ id: articleId, url: data.audioUrl, title: title, artist: "LaterLeaf Podcast" });
            }
        },
        onError: (err: Error) => {
            console.error('❌ Generation error:', err);
            setLocalError(err.message);
        }
    });

    // --- MUTATION: Delete Podcast ---
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/podcast-audio`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete podcast');

            // Handle 204 No Content or empty bodies gracefully
            if (response.status === 204) return {};
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        },
        onSuccess: () => {
            console.log(`✅ Podcast deleted successfully`);
            queryClient.setQueryData(['podcast', articleId], null);
            queryClient.invalidateQueries({ queryKey: ['podcast', articleId] });

            // Reset global player if this was the track
            if (isThisTrackLoaded) {
                closePlayer();
            }

            setShowDeleteConfirm(false);
        },
        onError: (err: Error) => {
            setLocalError(err.message);
        }
    });

    const getStyleForVoicePair = (pairId: string): 'casual' | 'professional' | 'educational' => {
        switch (pairId) {
            case 'charon-fenrir':
                return 'professional';
            case 'zephyr-charon':
            case 'kore-fenrir':
                return 'educational';
            case 'puck-kore':
            case 'puck-charon':
            default:
                return 'casual';
        }
    };

    const generatePodcast = async (forceRegenerate = false) => {
        setLocalError(null);
        if (!isPro) {
            alert('Podcast generation is a Pro-only feature.');
            return;
        }

        const langName = (selectedLanguage && selectedLanguage !== 'original')
            ? LANGUAGES.find(l => l.code === selectedLanguage)?.name
            : undefined;

        generateMutation.mutate({
            force: forceRegenerate,
            duration: podcastDuration,
            voices: selectedVoicePair,
            style: getStyleForVoicePair(selectedVoicePair),
            language: langName
        });
    };

    const togglePlayback = async () => {
        if (!audioUrl) {
            setLocalError('No audio available for playback');
            return;
        }

        if (isThisTrackLoaded) {
            globalTogglePlayback();
        } else {
            playTrack({ id: articleId, url: audioUrl, title: title, artist: "LaterLeaf Podcast" });
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isThisTrackLoaded) return;
        const newTime = parseFloat(e.target.value);
        seek(newTime);
    };

    const deletePodcast = () => {
        deleteMutation.mutate();
    };

    const skipForwardHandler = () => {
        if (isThisTrackLoaded) skipForward();
    };

    const skipBackwardHandler = () => {
        if (isThisTrackLoaded) skipBackward();
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

    return (
        <div className={`article-podcast-player ${className} ${isLoading ? 'is-loading' : ''}`}>
            {showWaveform && !isLoading && isThisTrackPlaying && <WaveformAnimation isPlaying={true} className="player-background-waveform" />}

            <div className="podcast-header">
                <div className="podcast-info">
                    <h4>
                        🎙️ Podcast Discussion {selectedLanguage && selectedLanguage !== 'original' && selectedLanguage !== 'en' && (
                            <span style={{ fontSize: '0.9em', opacity: 0.8, fontWeight: 'normal', marginLeft: '0.5rem' }}>
                                ({LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage})
                            </span>
                        )}
                    </h4>
                    {isLoading ? (
                        <p className="loading-status">
                            <FontAwesomeIcon icon={faSpinner} spin />
                            {isGenerating ? ' Generating podcast...' : ' Loading...'}
                        </p>
                    ) : (
                        <p>Podcast-style conversation about: "{title}"</p>
                    )}
                </div>
                {!isLoading && (
                    <button
                        onClick={handleDownload}
                        className="download-button"
                        title={audioUrl ? "Download Audio" : "Generate podcast to download"}
                        disabled={!audioUrl}
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                )}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="settings-toggle"
                    title="Podcast Settings"
                >
                    <FontAwesomeIcon icon={faCog} />
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="close-button"
                        title="Close Podcast"
                    >
                        ✕
                    </button>
                )}
            </div>

            {showSettings && !isLoading && (
                <div className="podcast-settings">
                    <div className="setting-group">
                        <label>Duration:</label>
                        <select
                            value={podcastDuration}
                            onChange={(e) => setPodcastDuration(e.target.value as 'short' | 'medium' | 'long')}
                            disabled={isLoading}
                        >
                            <option value="short">Short (4-5 min)</option>
                            <option value="medium">Medium (8-10 min)</option>
                            <option value="long">Long (15 min)</option>
                            {/* 
                            <option value="short">Short (2-3 min)</option>
                            <option value="medium">Medium (4 min)</option>
                            <option value="long">Long (5 min)</option>
                            */}
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>Voice Pair:</label>
                        <select
                            value={selectedVoicePair}
                            onChange={(e) => setSelectedVoicePair(e.target.value)}
                            disabled={isLoading}
                            title={voicePairs.find(p => `${p.speaker1.toLowerCase()}-${p.speaker2.toLowerCase()}` === selectedVoicePair)?.description}
                        >
                            {voicePairs.map((pair, index) => (
                                <option
                                    key={index}
                                    value={`${pair.speaker1.toLowerCase()}-${pair.speaker2.toLowerCase()}`}
                                    title={pair.description}
                                >
                                    {pair.label}
                                </option>
                            ))}
                        </select>
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

                    <div className="setting-group">
                        <label>Waveform:</label>
                        <select
                            value={showWaveform ? 'show' : 'hide'}
                            onChange={(e) => handleToggleWaveform(e.target.value === 'show')}
                            disabled={isLoading}
                        >
                            <option value="show">Show Animation</option>
                            <option value="hide">Hide Animation</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="podcast-controls">
                {!isPro ? (
                    <div className="pro-required-banner">
                        <div className="upgrade-message">
                            🎙️ Pro Required for Podcasts
                        </div>
                        <p className="upgrade-description">
                            Multi-speaker audio generation requires a Pro subscription.
                            Upgrade to unlock premium AI features.
                        </p>
                    </div>
                ) : (
                    <div className="primary-controls">
                        {isLoading ? (
                            <div className="loading-container">
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <span>{isGenerating ? 'Generating podcast discussion...' : 'Checking for existing podcast...'}</span>
                            </div>
                        ) : audioUrl ? (
                            <div className="playback-controls">
                                <button
                                    onClick={skipBackwardHandler}
                                    disabled={!audioUrl}
                                    className="skip-button skip-backward"
                                    title="Skip backward 10s"
                                >
                                    <FontAwesomeIcon icon={faRotateLeft} />
                                </button>
                                <button
                                    onClick={togglePlayback}
                                    className="play-button"
                                    title={isThisTrackPlaying ? 'Pause' : (isThisTrackLoaded && currentTime >= duration && duration > 0) ? 'Replay' : 'Play'}
                                >
                                    {isThisTrackPlaying ? (
                                        <FontAwesomeIcon icon={faPause} />
                                    ) : (isThisTrackLoaded && currentTime >= duration && duration > 0) ? (
                                        <FontAwesomeIcon icon={faRedo} />
                                    ) : (
                                        <FontAwesomeIcon icon={faPlay} />
                                    )}
                                </button>
                                <button
                                    onClick={skipForwardHandler}
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
                        ) : !isLanguageSupported ? (
                            <div className="unsupported-language-container">
                                <button className="generate-btn disabled" disabled>
                                    <FontAwesomeIcon icon={faPodcast} />
                                    <span>Unavailable in this language</span>
                                </button>
                                <p className="unsupported-notice">
                                    Audio generation is currently not available for {LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'this language'}.
                                </p>
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
                                        <span>{formatTime(isThisTrackLoaded ? currentTime : 0)}</span>
                                        <span>/</span>
                                        <span>{formatTime(isThisTrackLoaded ? duration : prefetchedDuration)}</span>
                                    </>
                                ) : (
                                    <span>Ready to generate podcast discussion</span>
                                )}
                            </div>
                            {!isLoading && (
                                <div className="tier-info">
                                    <small>
                                        🎙️ Pro Feature - Premium Quality •
                                        Multiple voice pairs available
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {audioUrl && isPro && (
                    <div className="progress-controls">
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