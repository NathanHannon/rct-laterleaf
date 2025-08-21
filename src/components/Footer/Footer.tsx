import React from 'react';
import './Footer.scss';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-links">
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/faq">FAQ</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="mailto:abuse@laterleaf.com?subject=Abuse Report">Report Abuse</a>
            </div>
            <p className="copyright">@{currentYear} laterLeaf. All rights reserved.</p>
        </footer>
    );
};

export default Footer; 