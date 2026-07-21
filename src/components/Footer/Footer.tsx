import React from 'react';
import './Footer.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconProp } from '@fortawesome/fontawesome-svg-core';
import { faXTwitter, faInstagram, faThreads } from '@fortawesome/free-brands-svg-icons';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-links">
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/faq">FAQ</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="mailto:abuse@laterleaf.com?subject=Abuse Report">Report Abuse</a>
            </div>

            <div className="footer-socials">
                <a href="https://x.com/laterleaf" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                    <FontAwesomeIcon icon={faXTwitter as IconProp} />
                </a>
                <a href="https://instagram.com/laterleafhq" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <FontAwesomeIcon icon={faInstagram as IconProp} />
                </a>
                <a href="https://www.threads.net/@laterleafhq" target="_blank" rel="noopener noreferrer" aria-label="Threads">
                    <FontAwesomeIcon icon={faThreads as IconProp} />
                </a>
            </div>

            <p className="copyright">@{currentYear} LaterLeaf. All rights reserved.</p>
        </footer>
    );
};

export default Footer;