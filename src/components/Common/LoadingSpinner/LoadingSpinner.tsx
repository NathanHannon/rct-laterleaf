import React from 'react';
import './LoadingSpinner.scss';
import LaterLeafLogo from '../LaterLeafLogo/LaterLeafLogo';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    size?: 'small' | 'medium' | 'large';
    label?: string;
    overlay?: boolean; // New prop for transparent overlay over existing content
    layout?: 'vertical' | 'horizontal';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    fullScreen = false,
    size = 'medium',
    label,
    overlay = false,
    layout = 'vertical'
}) => {
    const iconSize = size === 'small' ? 12 : size === 'large' ? 32 : 24;

    return (
        <div className={`loading-spinner-container ${fullScreen ? 'full-screen' : ''} ${overlay ? 'overlay' : ''} layout-${layout}`}>
            <div className={`spinner-wrapper`}>
                <div className={`spinner ${size}`}></div>
                {/* Inner Bookmark Leaf accent */}
                <div className="leaf-icon">
                    <LaterLeafLogo size={iconSize} ariaLabel="" />
                </div>
            </div>
            {label && <p className="loading-label">{label}</p>}
        </div>
    );
};

export default LoadingSpinner;
