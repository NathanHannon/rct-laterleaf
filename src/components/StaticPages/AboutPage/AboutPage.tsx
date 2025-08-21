import React from 'react';
import './AboutPage.scss';

const AboutPage: React.FC = () => {
    return (
        <div className="about-page">
            <div className="page-container">
                <h1>About Later Leaf</h1>

                <section className="intro">
                    <p>
                        Later Leaf is a modern article management platform designed to help you save,
                        organize, and rediscover content that matters to you. Whether you're a researcher,
                        student, or simply someone who loves to read, Later Leaf provides the tools you
                        need to build your personal knowledge library.
                    </p>
                </section>

                <section className="features">
                    <h2>Key Features</h2>
                    <div className="feature-grid">
                        <div className="feature-item">
                            <h3>Smart Summarization</h3>
                            <p>Our AI-powered summarization helps you quickly understand the key points of any article.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Collection Management</h3>
                            <p>Organize your articles into custom collections for easy retrieval and reference.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Advanced Search</h3>
                            <p>Find articles quickly with our intelligent search that understands context and meaning.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Interactive Chat</h3>
                            <p>Engage with your saved articles through our AI chat feature (Pro users).</p>
                        </div>
                    </div>
                </section>

                <section className="mission">
                    <h2>Our Mission</h2>
                    <p>
                        We believe that information should be accessible, organized, and actionable.
                        Later Leaf empowers users to build their own curated knowledge base,
                        making it easier to learn, research, and stay informed in our fast-paced digital world.
                    </p>
                </section>

                <section className="values">
                    <h2>Our Values</h2>
                    <ul>
                        <li><strong>Privacy First:</strong> Your data and reading habits are private and secure.</li>
                        <li><strong>User-Centric Design:</strong> Every feature is designed with user experience in mind.</li>
                        <li><strong>Continuous Innovation:</strong> We're constantly improving and adding new features.</li>
                        <li><strong>Accessibility:</strong> Knowledge should be accessible to everyone.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default AboutPage;
