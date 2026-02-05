import React from 'react';
import './TermsPage.scss';

const TermsPage: React.FC = () => {
    return (
        <div className="terms-page">
            <div className="page-container">
                <h1>Terms of Service</h1>

                <div className="last-updated">
                    <p><strong>Last Updated:</strong> February 5, 2026</p>
                </div>

                <section className="intro">
                    <p>
                        Welcome to Later Leaf. By accessing or using our website and services, you agree to be bound by these Terms of Service
                        and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.
                    </p>
                </section>

                <section className="section">
                    <h2>1. Use of Service</h2>
                    <ul>
                        <li><strong>Eligibility:</strong> You must be at least 13 years old to use this service.</li>
                        <li><strong>License:</strong> We grant you a limited, non-exclusive, non-transferable license to use Later Leaf for personal, non-commercial purposes.</li>
                        <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
                    </ul>
                </section>

                <section className="section">
                    <h2>2. User Content and Conduct</h2>
                    <ul>
                        <li><strong>Saved Content:</strong> Later Leaf allows you to save and organize articles from around the web. You acknowledge that you are using this service for personal archiving and reading purposes.</li>
                        <li><strong>Copyright Respect:</strong> You agree not to use the service to infringe upon the intellectual property rights of others. We respect the rights of content creators and publishers.</li>
                        <li><strong>Prohibited Actions:</strong> You may not use the service to:
                            <ul>
                                <li>Violate any applicable laws or regulations.</li>
                                <li>Distribute malware or malicious code.</li>
                                <li>Attempt to interfere with or compromise the system integrity or security.</li>
                                <li>Scrape or mass-export data from the service without permission.</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className="section">
                    <h2>3. AI Features</h2>
                    <ul>
                        <li><strong>Summaries & Audio:</strong> Our service uses artificial intelligence to generate summaries and audio versions of content. While we strive for accuracy, AI-generated content may occasionally be incorrect or misleading.</li>
                        <li><strong>Usage Limits:</strong> Access to AI features may be subject to usage limits or requires a specific subscription tier (e.g., Pro).</li>
                    </ul>
                </section>

                <section className="section">
                    <h2>4. Intellectual Property</h2>
                    <p>
                        The Later Leaf service, including its original content, features, and functionality, is and will remain the exclusive property of Later Leaf and its licensors.
                        The service is protected by copyright, trademark, and other laws.
                    </p>
                </section>

                <section className="section">
                    <h2>5. Termination</h2>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        Upon termination, your right to use the Service will immediately cease.
                    </p>
                </section>

                <section className="section">
                    <h2>6. Limitation of Liability</h2>
                    <p>
                        In no event shall Later Leaf, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
                        including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>
                </section>

                <section className="section">
                    <h2>7. Changes to Terms</h2>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
                        What constitutes a material change will be determined at our sole discretion.
                    </p>
                </section>

                <section className="section">
                    <h2>Contact Us</h2>
                    <p>If you have any questions about these Terms, please contact us:</p>
                    <div className="contact-info">
                        <p>Email: <a href="mailto:support@laterleaf.com">support@laterleaf.com</a></p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TermsPage;
