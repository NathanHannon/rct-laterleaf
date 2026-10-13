import React from 'react';
import StaticPage from '../StaticPage';

const PrivacyPage: React.FC = () => {
    return (
        <StaticPage className="privacy-page" title="Privacy policy." eyebrow="Your information">

            <div className="last-updated">
                <p><strong>Last Updated:</strong> August 17, 2025</p>
            </div>

            <section className="intro">
                <p>
                    At Later Leaf, we take your privacy seriously. This Privacy Policy explains how we collect,
                    use, disclose, and safeguard your information when you use our article management platform.
                </p>
            </section>

            <section className="section">
                <h2>Information We Collect</h2>

                <h3>Personal Information</h3>
                <ul>
                    <li><strong>Account Information:</strong> Email address, username, and profile information</li>
                    <li><strong>Content:</strong> Articles you save, summaries generated, and collections you create</li>
                    <li><strong>Usage Data:</strong> How you interact with our platform, features used, and preferences</li>
                </ul>

                <h3>Automatically Collected Information</h3>
                <ul>
                    <li><strong>Technical Data:</strong> IP address, browser type, device information, and operating system</li>
                    <li><strong>Essential Cookies:</strong> Authentication cookies necessary for login and session management (via Clerk)</li>
                    <li><strong>Usage Data:</strong> Basic usage patterns to improve our service (no third-party tracking)</li>
                </ul>
            </section>

            <section className="section">
                <h2>How We Use Your Information</h2>
                <ul>
                    <li>Provide and maintain our article management services</li>
                    <li>Generate AI-powered summaries and chat responses</li>
                    <li>Personalize your experience and improve our platform</li>
                    <li>Communicate with you about updates, support, and account-related matters</li>
                    <li>Analyze usage patterns to enhance our features and performance</li>
                    <li>Ensure security and prevent fraud or abuse</li>
                </ul>
            </section>

            <section className="section">
                <h2>Information Sharing and Disclosure</h2>
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                <ul>
                    <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our platform (e.g., cloud hosting, analytics)</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of Later Leaf, our users, or others</li>
                </ul>
            </section>

            <section className="section">
                <h2>Data Security</h2>
                <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
                <ul>
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication systems</li>
                    <li>Secure data centers and infrastructure</li>
                </ul>
            </section>

            <section className="section">
                <h2>Your Rights and Choices</h2>
                <ul>
                    <li><strong>Access:</strong> You can view and update your account information at any time</li>
                    <li><strong>Deletion:</strong> You can delete your account and associated data</li>
                    <li><strong>Data Portability:</strong> You can export your saved articles and collections</li>
                    <li><strong>Communication Preferences:</strong> You can opt out of non-essential communications</li>
                    <li><strong>Cookie Controls:</strong> You can manage cookie preferences through your browser settings</li>
                </ul>
            </section>

            <section className="section">
                <h2>Data Retention</h2>
                <p>
                    We retain your personal information for as long as your account is active or as needed to provide services.
                    We may retain certain information for longer periods as required by law or for legitimate business purposes,
                    such as fraud prevention and safety.
                </p>
            </section>

            <section className="section">
                <h2>Children's Privacy</h2>
                <p>
                    Later Leaf is not intended for use by children under the age of 13. We do not knowingly collect
                    personal information from children under 13. If we become aware that we have collected such information,
                    we will take steps to delete it promptly.
                </p>
            </section>

            <section className="section">
                <h2>International Data Transfers</h2>
                <p>
                    Your information may be transferred to and processed in countries other than your own.
                    We ensure appropriate safeguards are in place to protect your personal information in accordance
                    with this Privacy Policy.
                </p>
            </section>

            <section className="section">
                <h2>Changes to This Privacy Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material changes
                    by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                    We encourage you to review this Privacy Policy periodically.
                </p>
            </section>

            <section className="section">
                <h2>Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                </p>
                <div className="contact-info">
                    <p><strong>Email:</strong> <a href="mailto:privacy@laterleaf.com">privacy@laterleaf.com</a></p>
                    <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
                </div>
            </section>
        </StaticPage>
    );
};

export default PrivacyPage;
