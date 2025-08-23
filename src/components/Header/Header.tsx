import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
    useUser,
} from "@clerk/clerk-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faBookmark, faArchive, faGem, faFolderOpen, faFileExport } from '@fortawesome/free-solid-svg-icons';
import { useSearch } from '../../hooks/searchHook';
import { useUserStatus } from '../../context/UserStatusContext'; // Import the new hook
import { hasProAccess, extractUserTier } from '../../utils/tierUtils';
import UpgradeButton from '../Common/Controls/UpgradeButton/UpgradeButton';
import './Header.scss';
import logo from '../../assets/logo/icon-transparent.png';

const Header: React.FC = () => {
    const { searchTerm, setSearchTerm } = useSearch();
    const { user, isLoaded } = useUser();
    const { isPro, isLoading } = useUserStatus(); // Use the hook to get status from your DB
    const userHasProAccess = hasProAccess(user);

    // Log user plan tier when user data becomes available
    useEffect(() => {
        if (isLoaded && user) {
            const tier = extractUserTier(user);
            const features = (user.publicMetadata?.features as string[]) || [];
            const role = user.publicMetadata?.role as string;

            // Extract plan info from JWT if available
            const userWithToken = user as typeof user & {
                unsafeMetadata?: { _rawToken?: { pla?: string } };
                __unstable__environment?: { jwt?: { pla?: string } };
            };
            const rawToken = userWithToken.unsafeMetadata?._rawToken ||
                userWithToken.__unstable__environment?.jwt || {};
            const plaField = rawToken.pla || 'unknown';

            console.log('🎯 Frontend User Sign-In Detected:', {
                userId: user.id.substring(0, 8) + '...',
                email: user.primaryEmailAddress?.emailAddress || 'no email',
                planTier: tier,
                plaField,
                features: features.length > 0 ? features : 'none',
                role: role || 'none',
                hasProAccess: userHasProAccess,
                signInTime: new Date().toISOString()
            });
        }
    }, [isLoaded, user, userHasProAccess]);

    // Log pro status for debugging
    console.log('🎨 Header: Pro access status:', userHasProAccess);

    // A clearer placeholder for the free user
    const freePlaceholder = "Search titles & excerpts...";

    // A more powerful placeholder for the pro user
    const proPlaceholder = "Search the full content of your entire library..."


    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="logo">
                    <img src={logo} alt="laterLeaf logo" />
                    <h2>Later Leaf</h2>
                </Link>
                <nav className="nav-links">
                    <Link to="/articles"><FontAwesomeIcon icon={faInbox} /><span>Articles</span></Link>
                    <Link to="/bookmarks"><FontAwesomeIcon icon={faBookmark} /><span>Bookmarks</span></Link>
                    <Link to="/collections"><FontAwesomeIcon icon={faFolderOpen} /><span>Collections</span></Link>
                    <Link to="/export"><FontAwesomeIcon icon={faFileExport} /><span>Export</span></Link>
                    <Link to="/archive"><FontAwesomeIcon icon={faArchive} /><span>Archive</span></Link>
                </nav>
            </div>
            <div className="header-center">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder={userHasProAccess ? proPlaceholder : freePlaceholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    {userHasProAccess && <FontAwesomeIcon icon={faGem} className="premium-icon" />}
                </div>
            </div>
            <div className="header-right">
                <div className="auth-container">
                    <SignedOut>
                        <SignInButton />
                        <SignUpButton />
                    </SignedOut>
                    <SignedIn>
                        {/* Show upgrade button only if status is loaded and user is not pro */}
                        {!isLoading && !isPro && <UpgradeButton />}
                        <UserButton />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
};

export default Header;