import React, { useId } from 'react';
import { motion } from 'motion/react';

interface BookmarkLeafIconProps {
    filled: boolean;
    size?: number;
    className?: string;
    animateVein?: boolean;
}

const BOOKMARK_LEAF_PATH =
    'M 15 55 L 15 31 C 15 15, 29 7, 48 7 C 49.5 17, 49 25, 49 33 L 49 55 C 49 56.8, 46.9 57.8, 45.5 56.6 L 32 45.5 L 18.5 56.6 C 17.1 57.8, 15 56.8, 15 55 Z';

const BookmarkLeafIcon: React.FC<BookmarkLeafIconProps> = ({
    filled,
    size = 20,
    className,
    animateVein = true,
}) => {
    const gradientId = useId();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            className={className}
            aria-hidden="true"
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
                    <stop offset="0%" stopColor="var(--primary-hover, #15803d)" />
                    <stop offset="55%" stopColor="var(--primary-color, #22c55e)" />
                    <stop offset="100%" stopColor="var(--primary-color, #4ade80)" />
                </linearGradient>
            </defs>

            {/* Bookmark Leaf silhouette: outline when unsaved, rich theme fill when bookmarked */}
            <motion.path
                d={BOOKMARK_LEAF_PATH}
                fill={filled ? `url(#${gradientId})` : 'transparent'}
                stroke={filled ? 'none' : 'currentColor'}
                strokeWidth={filled ? 0 : 4.2}
                strokeLinejoin="round"
                initial={false}
                animate={{
                    scale: filled ? 1 : 0.96,
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                style={{ transformOrigin: '32px 32px' }}
            />

            {/* Subtle highlight facet when filled */}
            {filled && (
                <path
                    d="M 48 7 C 37 15, 30 26, 28 38 L 32 41 L 49 55 L 49 33 C 49 25, 49.5 17, 48 7 Z"
                    fill="#ffffff"
                    fillOpacity="0.16"
                />
            )}

            {/* Leaf midrib vein: faint hint when outline, draws in cleanly when bookmarked */}
            <motion.path
                d="M 24 38 C 27 27, 33 19, 41 14"
                stroke={filled ? 'var(--button-text, #052e16)' : 'currentColor'}
                strokeWidth={filled ? 3.8 : 3}
                strokeLinecap="round"
                initial={animateVein && filled ? { pathLength: 0, opacity: 0 } : false}
                animate={{
                    pathLength: filled ? 1 : 0.7,
                    opacity: filled ? 1 : 0.45,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            <motion.path
                d="M 29 26 L 25.5 20.5"
                stroke={filled ? 'var(--button-text, #052e16)' : 'currentColor'}
                strokeWidth={filled ? 3 : 2.5}
                strokeLinecap="round"
                initial={animateVein && filled ? { pathLength: 0, opacity: 0 } : false}
                animate={{
                    pathLength: filled ? 1 : 0,
                    opacity: filled ? 1 : 0,
                }}
                transition={{ duration: 0.25, delay: filled ? 0.12 : 0, ease: 'easeOut' }}
            />
        </svg>
    );
};

export default BookmarkLeafIcon;
