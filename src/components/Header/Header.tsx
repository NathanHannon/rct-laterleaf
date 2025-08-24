import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faBookmark, faArchive, faGem, faFolderOpen, faFileExport, faCompass, faEllipsisH, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSearch } from '../../hooks/searchHook';
import { useUserStatus } from '../../context/userStatusContext';
import { hasProAccess } from '../../utils/tierUtils';
import './Header.scss';
import logo from '../../assets/logo/icon-transparent.png';

const Header: React.FC = () => {
    const { searchTerm, setSearchTerm } = useSearch();
    const { user } = useUser();
    const { isPro } = useUserStatus();
    const userHasProAccess = hasProAccess(user) || isPro;
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="app-header">
            <div className="header-left">
                <Link to="/" className="logo">
                    <img src={logo} alt="laterLeaf logo" />
                    <h2>Later Leaf</h2>
                </Link>
                <nav className="nav-links">
                    <Link to="/discover" className="nav-item"><FontAwesomeIcon icon={faCompass} /><span>Discover</span></Link>
                    <Link to="/articles" className="nav-item"><FontAwesomeIcon icon={faInbox} /><span>Articles</span></Link>
                    <Link to="/bookmarks" className="nav-item"><FontAwesomeIcon icon={faBookmark} /><span>Bookmarks</span></Link>
                    <Link to="/collections" className="nav-item"><FontAwesomeIcon icon={faFolderOpen} /><span>Collections</span></Link>

                    <div className="nav-dropdown" ref={moreMenuRef}>
                        <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="nav-item nav-link-button">
                            <FontAwesomeIcon icon={faEllipsisH} />
                            <span>More</span>
                        </button>
                        {showMoreMenu && (
                            <div className="dropdown-menu">
                                <Link to="/export" onClick={() => setShowMoreMenu(false)}>
                                    <FontAwesomeIcon icon={faFileExport} />
                                    <span>Export</span>
                                </Link>
                                <Link to="/archive" onClick={() => setShowMoreMenu(false)}>
                                    <FontAwesomeIcon icon={faArchive} />
                                    <span>Archive</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            <div className="header-center">
                <div className={`search-bar ${userHasProAccess ? 'full-width' : ''}`}>
                    <input
                        type="text"
                        placeholder="Search your library..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="clear-search-button" aria-label="Clear search">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    )}
                </div>
            </div>

            <div className="header-right">
                <SignedIn>
                    {!userHasProAccess && (
                        <button className="upgrade-button">
                            <FontAwesomeIcon icon={faGem} />
                            <span>Upgrade to Pro</span>
                        </button>
                    )}
                    <UserButton />
                </SignedIn>
                <SignedOut>
                    <div className="auth-buttons">
                        <SignInButton mode="modal"><button className="sign-in-button">Sign In</button></SignInButton>
                        <SignUpButton mode="modal"><button className="sign-up-button">Sign Up</button></SignUpButton>
                    </div>
                </SignedOut>
            </div>
        </header>
    );
};

export default Header;