import React from 'react';
import './Header.scss';
import logo from '../../assets/logo/icon-transparent.png';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faBookmark, faArchive, faGem, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { useSearch } from '../../hooks/searchHook';
import { useUserTier } from '../../hooks/userTierHook';

const Header: React.FC = () => {
    const { searchTerm, setSearchTerm } = useSearch();
    const { hasProAccess } = useUserTier();

    // Log pro status for debugging
    console.log('🎨 Header: Pro access status:', hasProAccess);

    // A clearer placeholder for the free user
    const freePlaceholder = "Search titles & excerpts...";

    // A more powerful placeholder for the pro user
    const proPlaceholder = "Search the full content of your entire library...";


    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="logo">
                    <img src={logo} alt="laterLeaf logo" />
                    <h2>Later Leaf</h2>
                </div>
                <nav className="nav-links">
                    <a href="/articles"><FontAwesomeIcon icon={faInbox} /><span>Articles</span></a>
                    <a href="/bookmarks"><FontAwesomeIcon icon={faBookmark} /><span>Bookmarks</span></a>
                    <a href="/collections"><FontAwesomeIcon icon={faFolderOpen} /><span>Collections</span></a>
                    <a href="/archive"><FontAwesomeIcon icon={faArchive} /><span>Archive</span></a>
                </nav>
            </div>
            <div className="header-right">
                <div className="search-bar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path
                            d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                        ></path>
                    </svg>
                    <input
                        type="text"
                        placeholder={hasProAccess ? proPlaceholder : freePlaceholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    {hasProAccess && <FontAwesomeIcon icon={faGem} className="premium-icon" />}
                </div>
                <div className="auth-container">
                    <SignedOut>
                        <SignInButton />
                        <SignUpButton />
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
};

export default Header;