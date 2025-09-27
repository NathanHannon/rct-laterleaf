import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faSpinner, faHeadphones, faTimes, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import './ArticleAudioPlayer.scss';
import type { TTSVoice } from '../../../interfaces/text-to-speech';

interface ArticleAudioPlayerProps {
    articleId: string;
    hasContent: boolean;
    isVisible: boolean;
    onClose: () => void;
}

export const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({ articleId, hasContent, isVisible, onClose }) => {
    const [voices, setVoices] = useState<TTSVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<TTSVoice['voice']>('Charon');
    const [speed, setSpeed] = useState(1.0);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
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
        const audio = audioRef.current;
        return () => {
            if (audio) {
                audio.pause();
                URL.revokeObjectURL(audio.src);
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

        if (!isPlaying && audioRef.current && audioRef.current.src) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        setIsLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(
                `/api/articles/${articleId}/audio?voice=${selectedVoice}&speed=${speed}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );

            if (!response.ok) throw new Error('Failed to fetch audio.');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) URL.revokeObjectURL(audioRef.current.src);

            const newAudio = new Audio(audioUrl);
            audioRef.current = newAudio;

            newAudio.onloadedmetadata = () => setDuration(newAudio.duration);
            newAudio.ontimeupdate = () => setCurrentTime(newAudio.currentTime);
            newAudio.onended = () => setIsPlaying(false);

            newAudio.play();
            setIsPlaying(true);
        } catch (error) {
            console.error('Error playing audio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const newTime = Number(e.target.value);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="audio-player-wrapper"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <div className="audio-controls">
                        <button className="playback-button" onClick={handlePlayPause} disabled={!hasContent || isLoading}>
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div key="spinner"><FontAwesomeIcon icon={faSpinner} spin /></motion.div>
                                ) : isPlaying ? (
                                    <FontAwesomeIcon icon={faPause} key="pause" />
                                ) : (
                                    <FontAwesomeIcon icon={faHeadphones} key="play" />
                                )}
                            </AnimatePresence>
                        </button>
                    </div>

                    <div className="timeline-container">
                        <span className="time-display current">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            className="timeline"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleTimelineChange}
                            disabled={!isPlaying && !currentTime}
                        />
                        <span className="time-display total">{formatTime(duration)}</span>
                    </div>

                    <div className="settings-controls">
                        <div className="select-wrapper">
                            <FontAwesomeIcon icon={faVolumeUp} className="select-icon" />
                            <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value as TTSVoice['voice'])} disabled={isPlaying || isLoading}>
                                {voices.map(v => <option key={v.voice} value={v.voice}>{v.voice}</option>)}
                            </select>
                        </div>
                        <div className="speed-control">
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={speed}
                                onChange={e => setSpeed(parseFloat(e.target.value))}
                                disabled={isPlaying || isLoading}
                            />
                            <span>{speed.toFixed(1)}x</span>
                        </div>
                    </div>

                    <button className="close-button" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};