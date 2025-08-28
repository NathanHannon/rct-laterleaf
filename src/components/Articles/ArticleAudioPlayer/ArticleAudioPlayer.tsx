import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faSpinner, faHeadphones } from '@fortawesome/free-solid-svg-icons';
import './ArticleAudioPlayer.scss';
import type { TTSVoice } from '../../../interfaces/text-to-speech';

export const ArticleAudioPlayer: React.FC<{ articleId: string; hasContent: boolean }> = ({ articleId, hasContent }) => {
    const [voices, setVoices] = useState<TTSVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<TTSVoice['voice']>('Charon');
    const [speed, setSpeed] = useState(1.0); // Default to normal speed for full articles
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { getToken } = useAuth();

    // Fetch available voices
    useEffect(() => {
        const fetchVoices = async () => {
            const token = await getToken();
            const response = await fetch('/api/ai/tts-voices', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data: TTSVoice[] = await response.json();
                setVoices(data);
                if (data.length > 0 && data.some(v => v.voice === 'Charon')) {
                    setSelectedVoice('Charon');
                } else if (data.length > 0) {
                    setSelectedVoice(data[0].voice);
                }
            }
        };
        fetchVoices();
    }, [getToken]);

    // Cleanup audio element on unmount or when article changes
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioRef.current.src);
            }
        };
    }, [articleId]);

    const handlePlayPause = async () => {
        if (!hasContent) return;

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        if (!isPlaying && audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        setIsLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(
                `/api/articles/${articleId}/audio?voice=${selectedVoice}&speed=${speed}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!response.ok) throw new Error('Failed to fetch audio.');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) URL.revokeObjectURL(audioRef.current.src);

            const newAudio = new Audio(audioUrl);
            audioRef.current = newAudio;
            newAudio.play();
            setIsPlaying(true);
            newAudio.onended = () => setIsPlaying(false);
        } catch (error) {
            console.error('Error playing audio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="article-audio-player actionable" // It's always actionable now
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            <div className="player-controls-wrapper">
                <button
                    className="play-pause-btn"
                    onClick={handlePlayPause}
                    disabled={!hasContent || isLoading}
                    title={hasContent ? (isPlaying ? 'Pause' : 'Listen to Article') : 'Article content not available'}
                >
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div key="spinner">
                                <FontAwesomeIcon icon={faSpinner} spin />
                            </motion.div>
                        ) : isPlaying ? (
                            <FontAwesomeIcon icon={faPause} key="pause" />
                        ) : (
                            <FontAwesomeIcon icon={faHeadphones} key="play" />
                        )}
                    </AnimatePresence>
                </button>
                <div className="settings">
                    <div className="control-group">
                        <label htmlFor="voice-select">Voice</label>
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={e => setSelectedVoice(e.target.value as TTSVoice['voice'])}
                            disabled={!hasContent || isPlaying || isLoading}
                        >
                            {voices.map(v => (
                                <option key={v.voice} value={v.voice}>
                                    {v.voice}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="control-group">
                        <label htmlFor="speed-slider">Speed ({speed.toFixed(1)}x)</label>
                        <input
                            type="range"
                            id="speed-slider"
                            min="0.5"
                            max="2.0" // Increased max speed for longer content
                            step="0.1"
                            value={speed}
                            onChange={e => setSpeed(parseFloat(e.target.value))}
                            disabled={!hasContent || isPlaying || isLoading}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};