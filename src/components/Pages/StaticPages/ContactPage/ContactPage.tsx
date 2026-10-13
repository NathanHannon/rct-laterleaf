import React from 'react';
import { Link } from 'react-router-dom';
import StaticPage from '../StaticPage';

const ContactPage: React.FC = () => {
    return (
        <StaticPage className="contact-page" title="Get in touch." eyebrow="Contact LaterLeaf">

            <section className="intro">
                <p>
                    We'd love to hear from you! Whether you have questions, feedback, or need support,
                    there are several ways to get in touch with the LaterLeaf team.
                </p>
            </section>

            <div className="contact-methods">
                <div className="contact-card">
                    <h2>General Support</h2>
                    <p>For questions about your account, billing, or general support:</p>
                    <a href="mailto:support@laterleaf.com" className="contact-email">
                        support@laterleaf.com
                    </a>
                </div>

                <div className="contact-card">
                    <h2>Technical Issues</h2>
                    <p>Experiencing bugs or technical problems? Let us know:</p>
                    <a href="mailto:tech@laterleaf.com" className="contact-email">
                        tech@laterleaf.com
                    </a>
                </div>

                <div className="contact-card">
                    <h2>Business Inquiries</h2>
                    <p>For partnerships, enterprise solutions, or business-related questions:</p>
                    <a href="mailto:business@laterleaf.com" className="contact-email">
                        business@laterleaf.com
                    </a>
                </div>

                <div className="contact-card">
                    <h2>Report Abuse</h2>
                    <p>To report inappropriate content or abuse of our platform:</p>
                    <a href="mailto:abuse@laterleaf.com?subject=Abuse Report" className="contact-email">
                        abuse@laterleaf.com
                    </a>
                    <Link className="report-guidance" to="/report-abuse">What to include in a report →</Link>
                </div>
            </div>

            <section className="response-time">
                <h2>Response Times</h2>
                <div className="response-info">
                    <div className="response-item">
                        <strong>General Support:</strong> Within 24 hours
                    </div>
                    <div className="response-item">
                        <strong>Technical Issues:</strong> Within 12 hours for critical issues
                    </div>
                    <div className="response-item">
                        <strong>Business Inquiries:</strong> Within 48 hours
                    </div>
                    <div className="response-item">
                        <strong>Abuse Reports:</strong> Within 6 hours
                    </div>
                </div>
            </section>

            <section className="tips">
                <h2>Before You Contact Us</h2>
                <ul>
                    <li>Check our <a href="/faq">FAQ section</a> for quick answers to common questions</li>
                    <li>For technical issues, please include your browser and operating system information</li>
                    <li>Include relevant screenshots if reporting a visual bug</li>
                    <li>Provide specific details about what you were trying to do when the issue occurred</li>
                </ul>
            </section>
        </StaticPage>
    );
};

export default ContactPage;
