import React from 'react';
import { SignUpButton } from '@clerk/clerk-react';
import './HeroPage.scss';

const HeroPage: React.FC = () => {
    return (
        <div className="hero-page">
            <div className="hero-content">
                <h1 className="hero-title">Unlock Your Digital Library</h1>
                <p className="hero-subtitle">
                    Save, organize, and rediscover articles, all in one place. Stop losing track of valuable content.
                </p>
                <div className="hero-cta">
                    <SignUpButton mode="modal">
                        <button className="cta-button">Get Started for Free</button>
                    </SignUpButton>
                </div>
            </div>
            <div className="hero-visual">
                {/* Placeholder for a cool visual */}
            </div>
        </div>
    );
};

export default HeroPage;
