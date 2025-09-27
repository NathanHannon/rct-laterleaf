import React from 'react';
import { SignUpButton } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faBolt, faSearch, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './HeroPage.scss';

const HeroPage: React.FC = () => {
    const freePlanFeatures = [
        "Save unlimited articles",
        "15 standard summaries / month",
        "3 Pro summaries / month",
        "Basic keyword search"
    ];

    const proPlanFeatures = [
        "Everything in Free, plus:",
        "Unlimited Pro summaries",
        "Full-text semantic search",
        "Personalized AI Summaries",
        "Chat with your articles (Coming Soon)",
        "Offline mode (Coming Soon)"
    ];

    return (
        <div className="hero-page">
            {/* --- Main Hero Section --- */}
            <section className="hero-main">
                <div className="hero-content">
                    <h1 className="hero-title">Read Smarter, Not Harder.</h1>
                    <p className="hero-subtitle">
                        LaterLeaf is your intelligent second brain. Save articles from millions of news sites and blogs across the web, let AI summarize it, and find exactly what you need with powerful search.
                    </p>
                    <div className="hero-cta">
                        <SignUpButton mode="modal" redirectUrl='/dashboard'>
                            <button className="cta-button">Get Started for Free</button>
                        </SignUpButton>
                        <p className="cta-subtext">No credit card required.</p>
                    </div>
                </div>
            </section>

            {/* --- Key Benefits Section --- */}
            <section className="key-benefits">
                <div className="benefit-card">
                    <FontAwesomeIcon icon={faSave} className="benefit-icon" />
                    <h3>Never Lose an Article</h3>
                    <p>Save content from anywhere with a single click. Your personal library, organized and always available.</p>
                </div>
                <div className="benefit-card">
                    <FontAwesomeIcon icon={faBolt} className="benefit-icon" />
                    <h3>Instant AI Summaries</h3>
                    <p>Get the key insights from any article in seconds. Choose between quick overviews or in-depth Pro summaries.</p>
                </div>
                <div className="benefit-card">
                    <FontAwesomeIcon icon={faSearch} className="benefit-icon" />
                    <h3>Find Anything, Instantly</h3>
                    <p>Go beyond simple keywords. Pro users can search by concepts and ideas with semantic search.</p>
                </div>
            </section>

            {/* --- Features at a Glance Section --- */}
            <section className="features-glance">
                <h2>Features at a Glance</h2>
                <div className="features-container">
                    <div className="feature-list free">
                        <h3>Free</h3>
                        <ul>
                            {freePlanFeatures.map((feature, index) => (
                                <li key={index}>
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="feature-list pro">
                        <h3>Pro</h3>
                        <ul>
                            {proPlanFeatures.map((feature, index) => (
                                <li key={index}>
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <span dangerouslySetInnerHTML={{ __html: feature.replace('(Coming Soon)', '<em>(Coming Soon)</em>') }} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- Final CTA Section --- */}
            <section className="final-cta">
                <h2>Ready to Supercharge Your Reading?</h2>
                <SignUpButton mode="modal" redirectUrl='/dashboard'>
                    <button className="cta-button">Sign Up for Free</button>
                </SignUpButton>
            </section>
        </div>
    );
};

export default HeroPage;
