import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './TTSControls.scss';
import type { TTSControlsProps, TTSVoice } from '../../interfaces/text-to-speech';

export const TTSControls: React.FC<TTSControlsProps> = ({ articleId, variant = 'card' }) => {
    const [voices, setVoices] = useState<TTSVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<TTSVoice['voice']>('Charon');
    const [speed, setSpeed] = useState(0.9); // Slower default for summaries
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { getToken } = useAuth();

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

    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            if (audio) {
                audio.pause();
                URL.revokeObjectURL(audio.src);
            }
        };
    }, []);

    const handlePlayPause = async () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        if (!isPlaying && audioRef.current && audioRef.current.src) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        setIsLoading(true);
        try {
            const token = await getToken();
            // NOTE: This endpoint needs to be created in the backend.
            // It should generate audio for the article's *summary*.
            const response = await fetch(
                `/api/articles/${articleId}/summary/audio?voice=${selectedVoice}&speed=${speed}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );

            if (!response.ok) throw new Error('Failed to fetch summary audio.');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) URL.revokeObjectURL(audioRef.current.src);

            const newAudio = new Audio(audioUrl);
            audioRef.current = newAudio;
            newAudio.play();
            setIsPlaying(true);
            newAudio.onended = () => setIsPlaying(false);
        } catch (error) {
            console.error('Error playing summary audio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`tts-controls ${variant}`}>
            {variant === 'card' && (
                <div className="tts-header">
                    <h4>Listen to Summary</h4>
                </div>
            )}
            <div className="controls-wrapper">
                <button
                    className="play-pause-btn"
                    onClick={handlePlayPause}
                    disabled={isLoading}
                >
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div key="spinner"><FontAwesomeIcon icon={faSpinner} spin /></motion.div>
                        ) : isPlaying ? (
                            <FontAwesomeIcon icon={faPause} key="pause" />
                        ) : (
                            <FontAwesomeIcon icon={faPlay} key="play" />
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
                            disabled={isPlaying || isLoading}
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
                            max="1.5"
                            step="0.1"
                            value={speed}
                            onChange={e => setSpeed(parseFloat(e.target.value))}
                            disabled={isPlaying || isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};