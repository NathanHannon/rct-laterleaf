import React, { useState, useRef, useEffect } from 'react';
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

const WELCOME_AUDIO_URL = 'https://assets.laterleaf.com/audio/welcome-overview.mp3';

const SLIDES = [
    {
        title: "Build a Library, Not a Backlog",
        text: "Stop hoarding tabs. detailed summaries, auto-tagging, and semantic search turn your saved articles into a permanent knowledge base.",
        icon: faBookOpen,
        color: "#4a90e2"
    },
    {
        title: "Listen to Knowledge",
        text: "Don't just listen to a robot reading text. Generate conversational AI podcasts that discuss the articles for you.",
        icon: faHeadphones,
        color: "#50b83c"
    },
    {
        title: "Organize Your Mind",
        text: "Use AI to find connections between what you read today and what you saved last year.",
        icon: faBrain,
        color: "#9013fe"
    }
];

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Pause audio if user swipes away from the audio slide
    useEffect(() => {
        if (currentSlide !== 1 && isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [currentSlide, isPlaying]);

    if (!isOpen) return null;

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
        <div className="help-modal-overlay">
            <div className="help-modal">
                <button className="help-modal__close" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className="help-modal__content">
                    <div className="slides-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {SLIDES.map((slide, index) => (
                            <div className="slide" key={index}>
                                <div
                                    className="slide-image"
                                    style={{ backgroundColor: slide.color }}
                                >
                                    <FontAwesomeIcon icon={slide.icon} className="slide-icon-svg" />
                                </div>

                                <div className="slide-text">
                                    <h2>{slide.title}</h2>
                                    <p>{slide.text}</p>
                                </div>

                                {index === 1 && (
                                    <div className="audio-demo">
                                        <audio
                                            ref={audioRef}
                                            src={WELCOME_AUDIO_URL}
                                            onEnded={() => setIsPlaying(false)}
                                        />
                                        <button className={`demo-play-btn ${isPlaying ? 'playing' : ''}`} onClick={toggleAudio}>
                                            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                                            {isPlaying ? 'Pause Sample' : 'Hear User Example'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
            </div>
        </div>
    );
};

export default HelpModal;
