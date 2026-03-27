import React from 'react';
import { SignUpButton } from '@clerk/clerk-react';
import { motion, type Variants } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faBolt, faSearch, faCheckCircle, faHeadphones, faPuzzlePiece, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
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
        "Chat with your articles",
        "AI Research Assistant",
        "Offline mode (Coming Soon)"
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.23, 1, 0.32, 1]
            }
        }
    };

    return (
        <div className="hero-page">
            {/* --- Main Hero Section --- */}
            <section className="hero-main">
                <motion.div
                    className="hero-content"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.h1 className="hero-title" variants={itemVariants}>
                        Read Smarter, <br />Not Harder.
                    </motion.h1>
                    <motion.p className="hero-subtitle" variants={itemVariants}>
                        LaterLeaf is your intelligent second brain. Save articles from many popular news sites and blogs, let AI summarize the key points, and find exactly what you need with search.
                    </motion.p>
                    <motion.div className="hero-cta" variants={itemVariants}>
                        <SignUpButton mode="modal">
                            <button className="cta-button">Get Started for Free</button>
                        </SignUpButton>
                        <p className="cta-subtext">No credit card required.</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* --- Key Benefits Section --- */}
            <motion.section
                className="key-benefits"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <motion.div className="benefit-card" variants={itemVariants}>
                    <FontAwesomeIcon icon={faSave} className="benefit-icon" />
                    <h3>Save Articles That Matter</h3>
                    <p>Save content from many popular sites with a simple URL paste. Build your personal library of the articles you actually want to read.</p>
                </motion.div>
                <motion.div className="benefit-card" variants={itemVariants}>
                    <FontAwesomeIcon icon={faBolt} className="benefit-icon" />
                    <h3>AI Summaries</h3>
                    <p>Get key insights from supported articles in seconds. Our AI focuses on the main points so you can decide what's worth reading fully.</p>
                </motion.div>
                <motion.div className="benefit-card" variants={itemVariants}>
                    <FontAwesomeIcon icon={faSearch} className="benefit-icon" />
                    <h3>Find Anything, Instantly</h3>
                    <p>Go beyond simple keywords. Pro users can search by concepts and ideas with semantic search.</p>
                </motion.div>
                <motion.div className="benefit-card" variants={itemVariants}>
                    <FontAwesomeIcon icon={faHeadphones} className="benefit-icon" />
                    <h3>Listen on the Go</h3>
                    <p>Turn articles into engaging audio podcasts. Perfect for commuting or multitasking.</p>
                </motion.div>
                <motion.div className="benefit-card" variants={itemVariants}>
                    <FontAwesomeIcon icon={faPuzzlePiece} className="benefit-icon" />
                    <h3>Save in One Click</h3>
                    <p>Use our browser extension to save articles instantly as you browse the web. No need to copy-paste URLs.</p>
                </motion.div>
                <motion.div className="benefit-card" variants={itemVariants}>
                    <FontAwesomeIcon icon={faLayerGroup} className="benefit-icon" />
                    <h3>Stay Organized</h3>
                    <p>Keep your reading list tidy with custom collections and tags. Group related articles together for easy access.</p>
                </motion.div>
            </motion.section >

            {/* --- Features at a Glance Section --- */}
            <section className="features-glance">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                >
                    Features at a Glance
                </motion.h2>
                <motion.div
                    className="features-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    <motion.div className="feature-list free" variants={itemVariants}>
                        <h3>Free</h3>
                        <ul>
                            {freePlanFeatures.map((feature, index) => (
                                <li key={index}>
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                    <motion.div className="feature-list pro" variants={itemVariants}>
                        <h3>Pro</h3>
                        <ul>
                            {proPlanFeatures.map((feature, index) => (
                                <li key={index}>
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <span dangerouslySetInnerHTML={{ __html: feature.replace('(Coming Soon)', '<em>(Coming Soon)</em>') }} />
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>
            </section >

            {/* --- Final CTA Section --- */}
            <motion.section
                className="final-cta"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
                <h2>Ready to Supercharge Your Reading?</h2>
                <SignUpButton mode="modal">
                    <button className="cta-button">Sign Up for Free</button>
                </SignUpButton>
            </motion.section >
        </div >
    );
};

export default HeroPage;
