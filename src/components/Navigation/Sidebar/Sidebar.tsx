import { forwardRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faBookmark, faArchive, faFolderOpen, faFileExport, faCompass, faRss, faTimes, faSearch, faCog, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { useSearch } from '../../../hooks/searchHook';
import { hasProAccess } from '../../../utils/tierUtils';
import SearchModeToggle from '../../Search/SearchModeToggle/SearchModeToggle';
import HelpModal from '../../Common/HelpModal/HelpModal';
import Wrapped from '../../Wrapped/Wrapped';
import './Sidebar.scss';
import logo from '../../../assets/logo/icon-transparent.png';
import { useUserStatus } from '../../../hooks/useUserStatus';
import UpgradeButton from '../../Common/Controls/UpgradeButton/UpgradeButton';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ isOpen, onClose }, ref) => {
    const { searchTerm, setSearchTerm } = useSearch();
    // Use the UserStatusProvider for pro status
    const { isPro, isLoading } = useUserStatus();

    // Help Modal State
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    // Wrapped State
    const [isWrappedOpen, setIsWrappedOpen] = useState(false);

    const handleHelpClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsHelpModalOpen(true);
        onClose(); // Close sidebar when opening modal
    };

    // const handleWrappedClick = (e: React.MouseEvent) => {
    //     e.preventDefault();
    //     setIsWrappedOpen(true);
    //     onClose();
    // };

    // The hasProAccess utility now correctly receives a boolean
    const userHasProAccess = hasProAccess(isPro);

    return (
        <>
            <div className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} ref={ref}>
                <div className="sidebar__header">
                    <div className="sidebar__logo">
                        <img src={logo} alt="laterLeaf logo" />
                        <h3>LaterLeaf</h3>
                    </div>
                    <button
                        className="sidebar__close"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="sidebar__content">
                    {/* Search Section */}
                    <div className="sidebar__search">
                        <div className="search-container">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search your library..."
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
                        {/* Show search mode toggle for everyone since semantic search is free */}
                        <SignedIn>
                            <div className="search-mode-container">
                                <SearchModeToggle />
                            </div>
                        </SignedIn>
                    </div>

                    {/* Navigation Links */}
                    <nav className="sidebar__nav">
                        <div className="nav-section">
                            <h4>Navigation</h4>
                            <NavLink to="/discover" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faCompass} />
                                <span>Discover</span>
                            </NavLink>
                            <NavLink to="/feeds" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faRss} />
                                <span>Feeds</span>
                            </NavLink>
                            <NavLink to="/articles" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faInbox} />
                                <span>My Articles</span>
                            </NavLink>
                            <NavLink to="/bookmarks" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faBookmark} />
                                <span>Bookmarks</span>
                            </NavLink>
                            <NavLink to="/collections" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faFolderOpen} />
                                <span>Collections</span>
                            </NavLink>
                        </div>

                        <div className="nav-section">
                            <h4>Tools</h4>
                            <NavLink to="/archive" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faArchive} />
                                <span>Archive</span>
                            </NavLink>
                            <NavLink to="/export" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faFileExport} />
                                <span>Export</span>
                            </NavLink>
                            {/* 
                            <a href="#" onClick={handleWrappedClick} className="wrapped-link nav-link">
                                <FontAwesomeIcon icon={faGift} />
                                <span>Your Review</span>
                            </a>
                            */}
                            <NavLink to="/settings" onClick={onClose} className="nav-link">
                                <FontAwesomeIcon icon={faCog} />
                                <span>Settings</span>
                            </NavLink>
                            <a href="#" onClick={handleHelpClick} className="nav-link">
                                <FontAwesomeIcon icon={faQuestionCircle} />
                                <span>Help & Guide</span>
                            </a>
                        </div>
                    </nav>

                    {/* Pro Upgrade Section */}
                    <SignedIn>
                        {/* Use a loading check to avoid showing the button prematurely */}
                        {!isLoading && !userHasProAccess && (
                            <div className="sidebar__upgrade">
                                <UpgradeButton />
                            </div>
                        )}
                    </SignedIn>
                </div>
            </div>
            {/* Render Help Modal outside the sidebar container but triggered by it */}
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

            {/* Render Wrapped Overlay */}
            {isWrappedOpen && <Wrapped onClose={() => setIsWrappedOpen(false)} />}
        </>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;