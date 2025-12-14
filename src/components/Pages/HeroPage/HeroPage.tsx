import React from 'react';
import { SignUpButton } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faBolt, faSearch, faCheckCircle, faHeadphones } from '@fortawesome/free-solid-svg-icons';
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
        "Audio Overviews (Podcasts)",
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
                        LaterLeaf is your intelligent second brain. Save articles from many popular news sites and blogs, let AI summarize the key points, and find exactly what you need with search.
                    </p>
                    <div className="hero-cta">
                        <SignUpButton mode="modal">
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
                    <h3>Save Articles That Matter</h3>
                    <p>Save content from many popular sites with a simple URL paste. Build your personal library of the articles you actually want to read.</p>
                </div>
                <div className="benefit-card">
                    <FontAwesomeIcon icon={faBolt} className="benefit-icon" />
                    <h3>AI Summaries</h3>
                    <p>Get key insights from supported articles in seconds. Our AI focuses on the main points so you can decide what's worth reading fully.</p>
                </div>
                <div className="benefit-card">
                    <FontAwesomeIcon icon={faSearch} className="benefit-icon" />
                    <h3>Find Anything, Instantly</h3>
                    <p>Go beyond simple keywords. Pro users can search by concepts and ideas with semantic search.</p>
                    <div className="benefit-card">
                        <FontAwesomeIcon icon={faHeadphones} className="benefit-icon" />
                        <h3>Listen on the Go</h3>
                        <p>Turn articles into engaging audio podcasts. Perfect for commuting or multitasking.</p>
                    </div>
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
                <SignUpButton mode="modal">
                    <button className="cta-button">Sign Up for Free</button>
                </SignUpButton>
            </section>
        </div>
    );
};

export default HeroPage;
