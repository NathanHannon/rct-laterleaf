import React from 'react';
import './Footer.scss';

const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="footer-links">
                <a href="#">About</a>
                <a href="#">Contact</a>
                <a href="#">Privacy Policy</a>
            </div>
            <p className="copyright">@2024 laterLeaf. All rights reserved.</p>
        </footer>
    );
};

export default Footer; 