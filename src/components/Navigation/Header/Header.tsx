import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCog, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import ThemeSwitcher from '../../Common/ThemeSwitcher/ThemeSwitcher';
import Sidebar from '../Sidebar/Sidebar';
import SearchModeToggle from '../../Search/SearchModeToggle/SearchModeToggle';
import { useSearch } from '../../../hooks/searchHook';
import './Header.scss';
import logo from '../../../assets/logo/icon-transparent.png';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { searchTerm, setSearchTerm } = useSearch();

    const SEARCH_PATHS = ['/', '/articles', '/bookmarks', '/archive'];
    const showSearch = SEARCH_PATHS.includes(location.pathname)
        || location.pathname.startsWith('/collections/');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLogoHovered, setIsLogoHovered] = useState(false);
    const [logoIndex, setLogoIndex] = useState(0);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const logoVariants = [
        { className: 'font-default', text: 'LaterLeaf' },
        { className: 'font-sans', text: 'LaterLeaf' },
        { className: 'font-mono', text: 'LaterLeaf' },
        { className: 'font-cursive', text: 'LaterLeaf' },
        { className: 'font-slab', text: 'LaterLeaf' },
    ];

    // Logo animation logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLogoHovered) {
            interval = setInterval(() => {
                setLogoIndex((prev) => (prev + 1) % logoVariants.length);
            }, 2000);
        } else {
            setLogoIndex(0);
        }
        return () => clearInterval(interval);
    }, [isLogoHovered, logoVariants.length]);

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
                    <Show when="signed-in">
                        <button
                            className="sidebar-toggle"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    </Show>
                    <Link
                        to="/"
                        className="logo"
                        onMouseEnter={() => setIsLogoHovered(true)}
                        onMouseLeave={() => setIsLogoHovered(false)}
                    >
                        <img src={logo} alt="LaterLeaf logo" />
                        <div className="logo-text-container">
                            <div
                                className="logo-text-stack"
                                style={{ transform: `translateY(-${logoIndex * 2}rem)` }}
                            >
                                {logoVariants.map((variant, index) => (
                                    <h2 key={index} className={variant.className}>
                                        {variant.text}
                                    </h2>
                                ))}
                            </div>
                        </div>
                    </Link>
                </div>

                <Show when="signed-in">
                    {showSearch && (
                        <div className="header-center">
                            <div className="header-search">
                                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search your library..."
                                    aria-label="Search your library"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="clear-search-button"
                                        aria-label="Clear search"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>
                            <SearchModeToggle />
                        </div>
                    )}
                </Show>

                <div className="header-right">
                    <ThemeSwitcher />
                    <Show when="signed-in">
                        <UserButton>
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="Settings"
                                    labelIcon={<FontAwesomeIcon icon={faCog} />}
                                    onClick={() => navigate('/settings')}
                                />
                            </UserButton.MenuItems>
                        </UserButton>
                    </Show>
                    <Show when="signed-out">
                        <div className="auth-buttons">
                            <SignInButton mode="modal">
                                <button className="sign-in-button">Sign In</button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="sign-up-button">Sign Up</button>
                            </SignUpButton>
                        </div>
                    </Show>
                </div>
            </header>
            {/* Backdrop */}
            <Show when="signed-in">
                {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

                {/* Sidebar Component */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={closeSidebar}
                    ref={sidebarRef}
                />
            </Show>
        </>
    );
};

export default Header;