import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import { SignedIn } from "@clerk/clerk-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faBookmark, faArchive, faFolderOpen, faFileExport, faCompass, faTimes, faSearch, faCog } from '@fortawesome/free-solid-svg-icons';
import { useSearch } from '../../../hooks/searchHook';
import { hasProAccess } from '../../../utils/tierUtils';
import SearchModeToggle from '../../Search/SearchModeToggle/SearchModeToggle';
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

    // The hasProAccess utility now correctly receives a boolean
    const userHasProAccess = hasProAccess(isPro);

    return (
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
                    {/* Only show search mode toggle if user is signed in and pro */}
                    <SignedIn>
                        {userHasProAccess && (
                            <div className="search-mode-container">
                                <SearchModeToggle />
                            </div>
                        )}
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
                        <NavLink to="/settings" onClick={onClose} className="nav-link">
                            <FontAwesomeIcon icon={faCog} />
                            <span>Settings</span>
                        </NavLink>
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
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;