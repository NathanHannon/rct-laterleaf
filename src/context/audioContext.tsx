import React, { createContext, useState, useRef, useEffect, type ReactNode } from 'react';

export interface TrackData {
    id: string; // usually articleId
    url: string;
    title: string;
    artist?: string;
    coverUrl?: string;
}

interface AudioContextType {
    currentTrack: TrackData | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    volume: number;
    playTrack: (track: TrackData) => void;
    pauseTrack: () => void;
    resumeTrack: () => void;
    togglePlayback: () => void;
    seek: (time: number) => void;
    skipForward: () => void;
    skipBackward: () => void;
    setPlaybackRate: (rate: number) => void;
    setVolume: (vol: number) => void;
    closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRateState] = useState(1.0);
    const [volume, setVolumeState] = useState(1.0);

    // Initialize audio element once
    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'metadata'; // Fetch just enough to know the duration before play
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration || 0);
        const handleEnded = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.pause();
            audio.src = '';
        };
    }, []);

    // Sync media session (system controls)
    useEffect(() => {
        if ('mediaSession' in navigator && currentTrack) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist || 'LaterLeaf',
                artwork: currentTrack.coverUrl ? [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/png' }] : [],
            });

            navigator.mediaSession.setActionHandler('play', resumeTrack);
            navigator.mediaSession.setActionHandler('pause', pauseTrack);
            navigator.mediaSession.setActionHandler('seekbackward', skipBackward);
            navigator.mediaSession.setActionHandler('seekforward', skipForward);
        }
    }, [currentTrack]);

    const playTrack = (track: TrackData) => {
        if (!audioRef.current) return;

        // If clicking play on the same track again, just resume it
        if (currentTrack?.id === track.id && currentTrack?.url === track.url) {
            resumeTrack();
            return;
        }

        // Clean up old blob url if we are replacing it
        if (currentTrack?.url.startsWith('blob:') && currentTrack.url !== track.url) {
            URL.revokeObjectURL(currentTrack.url);
        }

        setCurrentTrack(track);
        audioRef.current.src = track.url;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
        setIsPlaying(true);
    };

    const pauseTrack = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const resumeTrack = () => {
        if (audioRef.current && currentTrack) {
            audioRef.current.play().catch(e => console.error("Playback failed:", e));
            setIsPlaying(true);
        }
    };

    const togglePlayback = () => {
        if (isPlaying) pauseTrack();
        else resumeTrack();
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

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

    const setPlaybackRate = (rate: number) => {
        setPlaybackRateState(rate);
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    };

    const setVolume = (vol: number) => {
        setVolumeState(vol);
        if (audioRef.current) {
            audioRef.current.volume = vol;
        }
    };

    const closePlayer = () => {
        pauseTrack();
        if (currentTrack?.url.startsWith('blob:')) {
            URL.revokeObjectURL(currentTrack.url);
        }
        setCurrentTrack(null);
        setCurrentTime(0);
        setDuration(0);
    };

    return (
        <AudioContext.Provider value={{
            currentTrack, isPlaying, currentTime, duration, playbackRate, volume,
            playTrack, pauseTrack, resumeTrack, togglePlayback, seek, skipForward, skipBackward,
            setPlaybackRate, setVolume, closePlayer
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export { AudioContext };
