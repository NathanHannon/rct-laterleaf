import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faChevronRight,
    faChevronLeft,
    faPlay,
    faPause,
    faBookOpen,
    faHeadphones,
    faBrain
} from '@fortawesome/free-solid-svg-icons';
import './HelpModal.scss';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WELCOME_AUDIO_URL = 'https://pub-b40f193b840d468fbddd1218629f7460.r2.dev/podcasts/sample/sample.m4a';

const SLIDES = [
    {
        title: "Build a Library, Not a Backlog",
        text: "Stop hoarding tabs. Detailed summaries, auto-tagging, and semantic search turn your saved articles into a permanent knowledge base.",
        icon: faBookOpen,
        color: "linear-gradient(135deg, #4a90e2, #007aff)"
    },
    {
        title: "Listen to Knowledge",
        text: "Don't just listen to a robot reading text. Generate conversational AI podcasts that discuss the articles for you.",
        icon: faHeadphones,
        color: "linear-gradient(135deg, #0f766e, #0d9488)"
    },
    {
        title: "Organize Your Mind",
        text: "Use AI to find connections between what you read today and what you saved last year.",
        icon: faBrain,
        color: "linear-gradient(135deg, #9b51e0, #7b1fa2)"
    }
];

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setCurrentSlide(0);
            setIsPlaying(false);
        }
    }, [isOpen]);

    // Pause audio if user swipes away from the audio slide
    useEffect(() => {
        if (currentSlide !== 1 && isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [currentSlide, isPlaying]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="help-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="help-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="help-modal__close" onClick={onClose} aria-label="Close modal">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>

                        <div className="help-modal__content">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    className="slide"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div
                                        className="slide-image"
                                        style={{ background: SLIDES[currentSlide].color }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
                                        >
                                            <FontAwesomeIcon icon={SLIDES[currentSlide].icon} className="slide-icon-svg" />
                                        </motion.div>
                                    </div>

                                    <div className="slide-text">
                                        <h2>{SLIDES[currentSlide].title}</h2>
                                        <p>{SLIDES[currentSlide].text}</p>
                                    </div>

                                    {currentSlide === 1 && (
                                        <div className="audio-demo">
                                            <audio
                                                ref={audioRef}
                                                src={WELCOME_AUDIO_URL}
                                                onEnded={() => setIsPlaying(false)}
                                                onPause={() => setIsPlaying(false)}
                                                onPlay={() => setIsPlaying(true)}
                                            />
                                            <motion.button
                                                className={`demo-play-btn ${isPlaying ? 'playing' : ''}`}
                                                onClick={toggleAudio}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                                                {isPlaying ? 'Pause Sample' : 'Hear User Example'}
                                            </motion.button>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="help-modal__footer">
                            <button onClick={prevSlide} className="nav-btn">
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>

                            <div className="dots">
                                {SLIDES.map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={`dot ${idx === currentSlide ? 'active' : ''}`}
                                        onClick={() => setCurrentSlide(idx)}
                                    />
                                ))}
                            </div>

                            <button onClick={nextSlide} className="nav-btn">
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HelpModal;
