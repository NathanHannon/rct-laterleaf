import React from 'react';
import './LoadingSpinner.scss';

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
    return (
        <div className={`loading-spinner-container ${fullScreen ? 'full-screen' : ''} ${overlay ? 'overlay' : ''} layout-${layout}`}>
            <div className={`spinner-wrapper`}>
                <div className={`spinner ${size}`}></div>
                {/* Inner leaf accent */}
                <div className="leaf-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.1" />
                        <path d="M12 21C12 12 21 3 21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
            {label && <p className="loading-label">{label}</p>}
        </div>
    );
};

export default LoadingSpinner;
