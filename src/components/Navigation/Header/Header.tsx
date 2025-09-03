import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import ThemeSwitcher from '../../Common/ThemeSwitcher/ThemeSwitcher';
import Sidebar from '../Sidebar/Sidebar';
import './Header.scss';
import logo from '../../../assets/logo/icon-transparent.png';

const Header: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Scroll detection for header styling
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            setIsScrolled(scrollTop > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsSidebarOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isSidebarOpen]);

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <>
            <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="header-left">
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                    <Link to="/" className="logo">
                        <img src={logo} alt="laterLeaf logo" />
                        <h2>Later Leaf</h2>
                    </Link>
                </div>

                <div className="header-right">
                    <ThemeSwitcher />
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <div className="auth-buttons">
                            <SignInButton mode="modal">
                                <button className="sign-in-button">Sign In</button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="sign-up-button">Sign Up</button>
                            </SignUpButton>
                        </div>
                    </SignedOut>
                </div>
            </header>

            {/* Backdrop */}
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

            {/* Sidebar Component */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={closeSidebar}
                ref={sidebarRef}
            />
        </>
    );
};

export default Header;