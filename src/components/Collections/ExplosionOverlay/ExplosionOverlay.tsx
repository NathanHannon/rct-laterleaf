import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCollectionAnimation } from '../../../hooks/useCollectionAnimation';
import './ExplosionOverlay.scss';

const ExplosionOverlay: React.FC = () => {
    const { animationState } = useCollectionAnimation();

    if (!animationState.isTransitioning) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fade-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 9999,
                    pointerEvents: 'none'
                }}
            />
        </AnimatePresence>
    );
};

export default ExplosionOverlay;
