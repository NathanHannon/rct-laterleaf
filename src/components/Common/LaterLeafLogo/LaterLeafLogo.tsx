import React, { useId } from 'react';

interface LaterLeafLogoProps {
    className?: string;
    size?: number;
    adaptive?: boolean;
    ariaLabel?: string;
}

const LaterLeafLogo: React.FC<LaterLeafLogoProps> = ({
    className,
    size = 32,
    adaptive = true,
    ariaLabel = 'LaterLeaf logo',
}) => {
    const gradientId = useId();

    const stopStart = adaptive ? 'var(--primary-hover, #15803d)' : '#15803d';
    const stopMid = adaptive ? 'var(--primary-color, #22c55e)' : '#22c55e';
    const stopEnd = adaptive ? 'var(--primary-color, #4ade80)' : '#4ade80';
    const veinColor = adaptive ? 'var(--button-text, #052e16)' : '#052e16';

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            className={className}
            role="img"
            aria-label={ariaLabel}
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="15"
                    y1="56"
                    x2="50"
                    y2="8"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor={stopStart} />
                    <stop offset="55%" stopColor={stopMid} />
                    <stop offset="100%" stopColor={stopEnd} />
                </linearGradient>
            </defs>
            <path
                d="M 15 55 L 15 31 C 15 15, 29 7, 48 7 C 49.5 17, 49 25, 49 33 L 49 55 C 49 56.8, 46.9 57.8, 45.5 56.6 L 32 45.5 L 18.5 56.6 C 17.1 57.8, 15 56.8, 15 55 Z"
                fill={`url(#${gradientId})`}
            />
            <path
                d="M 48 7 C 37 15, 30 26, 28 38 L 32 41 L 49 55 L 49 33 C 49 25, 49.5 17, 48 7 Z"
                fill="#ffffff"
                fillOpacity="0.16"
            />
            <path
                d="M 24 38 C 27 27, 33 19, 41 14"
                stroke={veinColor}
                strokeWidth="3.6"
                strokeLinecap="round"
            />
            <path
                d="M 29 26 L 25.5 20.5"
                stroke={veinColor}
                strokeWidth="2.8"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default LaterLeafLogo;
