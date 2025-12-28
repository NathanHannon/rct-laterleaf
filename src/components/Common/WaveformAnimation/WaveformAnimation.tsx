import React from 'react';
import './WaveformAnimation.scss';

interface WaveformAnimationProps {
    isPlaying: boolean;
    className?: string;
}

const WaveformAnimation: React.FC<WaveformAnimationProps> = ({
    isPlaying,
    className = ''
}) => {
    return (
        <div className={`waveform-animation ${className} ${isPlaying ? 'is-playing' : ''}`}>
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="threads-svg">
                <defs>
                    <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4285F4" stopOpacity="0" />
                        <stop offset="50%" stopColor="#4285F4" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#4285F4" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9b51e0" stopOpacity="0" />
                        <stop offset="50%" stopColor="#9b51e0" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#9b51e0" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e91e63" stopOpacity="0" />
                        <stop offset="50%" stopColor="#e91e63" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#e91e63" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00bcd4" stopOpacity="0" />
                        <stop offset="50%" stopColor="#00bcd4" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#00bcd4" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow-sharp">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-soft">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-distant">
                        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Distant Background threads (Deepest layer) */}
                <path className="thread thread-distant-1" d="M0,100 C200,80 600,120 800,100" fill="none" stroke="url(#grad-blue)" strokeWidth="0.3" filter="url(#glow-distant)" />
                <path className="thread thread-distant-2" d="M0,100 C200,120 600,80 800,100" fill="none" stroke="url(#grad-purple)" strokeWidth="0.3" filter="url(#glow-distant)" />

                {/* Main "Twisted Rope" threads */}
                <path className="thread thread-rope-1" d="M0,100 C200,60 600,140 800,100" fill="none" stroke="url(#grad-blue)" strokeWidth="2" filter="url(#glow-sharp)" />
                <path className="thread thread-rope-2" d="M0,100 C200,140 600,60 800,100" fill="none" stroke="url(#grad-purple)" strokeWidth="2" filter="url(#glow-sharp)" />

                {/* Accent threads for complexity */}
                <path className="thread thread-rope-3" d="M0,100 C250,70 550,130 800,100" fill="none" stroke="url(#grad-pink)" strokeWidth="1" filter="url(#glow-soft)" />
                <path className="thread thread-rope-4" d="M0,100 C250,130 550,70 800,100" fill="none" stroke="url(#grad-cyan)" strokeWidth="1" filter="url(#glow-soft)" />

                <path className="thread thread-center" d="M0,100 L800,100" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
            </svg>
        </div>
    );
};

export default WaveformAnimation;
