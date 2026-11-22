import { forwardRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Show } from "@clerk/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faBookmark, faArchive, faFolderOpen, faFileExport, faCompass, faRss, faTimes, faCog, faQuestionCircle, faAtom, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { hasProAccess } from '../../../utils/tierUtils';
import HelpModal from '../../Common/HelpModal/HelpModal';
import Wrapped from '../../Wrapped/Wrapped';
import './Sidebar.scss';
import LaterLeafLogo from '../../Common/LaterLeafLogo/LaterLeafLogo';
import { useUserStatus } from '../../../hooks/useUserStatus';
import UpgradeButton from '../../Common/Controls/UpgradeButton/UpgradeButton';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ isOpen, onClose, isCollapsed = false, onToggleCollapse }, ref) => {
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
            <div className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${isCollapsed ? 'sidebar--collapsed' : ''}`} ref={ref}>
                <div className="sidebar__header">
                    <Link to="/" className="sidebar__logo" onClick={onClose} title="LaterLeaf">
                        <LaterLeafLogo className="sidebar__logo-mark" size={28} />
                        <h3 className="sidebar__brand-text">LaterLeaf</h3>
                    </Link>
                    <button
                        className="sidebar__close"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="sidebar__content">
                    {/* Navigation Links */}
                    <nav className="sidebar__nav">
                        <div className="nav-section">
                            <h4>Your reading</h4>
                            <NavLink viewTransition to="/articles" onClick={onClose} className="nav-link" title="Library">
                                <FontAwesomeIcon icon={faInbox} />
                                <span>Library</span>
                            </NavLink>
                            <NavLink viewTransition to="/bookmarks" onClick={onClose} className="nav-link" title="Favorites">
                                <FontAwesomeIcon icon={faBookmark} />
                                <span>Favorites</span>
                            </NavLink>
                            <NavLink viewTransition to="/collections" onClick={onClose} className="nav-link" title="Collections">
                                <FontAwesomeIcon icon={faFolderOpen} />
                                <span>Collections</span>
                            </NavLink>
                        </div>
                        <div className="nav-section">
                            <h4>Explore</h4>
                            <NavLink viewTransition to="/discover" onClick={onClose} className="nav-link" title="Discover">
                                <FontAwesomeIcon icon={faCompass} />
                                <span>Discover</span>
                            </NavLink>
                            <NavLink viewTransition to="/feeds" onClick={onClose} className="nav-link" title="Feeds">
                                <FontAwesomeIcon icon={faRss} />
                                <span>Feeds</span>
                            </NavLink>
                            <NavLink viewTransition to="/research" onClick={onClose} className="nav-link" title="Research">
                                <FontAwesomeIcon icon={faAtom} />
                                <span>Research</span>
                            </NavLink>
                        </div>

                        <div className="nav-section">
                            <h4>Tools</h4>
                            <NavLink viewTransition to="/archive" onClick={onClose} className="nav-link" title="Archive">
                                <FontAwesomeIcon icon={faArchive} />
                                <span>Archive</span>
                            </NavLink>
                            <NavLink viewTransition to="/export" onClick={onClose} className="nav-link" title="Export">
                                <FontAwesomeIcon icon={faFileExport} />
                                <span>Export</span>
                            </NavLink>
                            <NavLink viewTransition to="/settings" onClick={onClose} className="nav-link" title="Settings">
                                <FontAwesomeIcon icon={faCog} />
                                <span>Settings</span>
                            </NavLink>
                            <a href="#" onClick={handleHelpClick} className="nav-link" title="Help & Guide">
                                <FontAwesomeIcon icon={faQuestionCircle} />
                                <span>Help & Guide</span>
                            </a>
                        </div>
                    </nav>

                    {/* Pro Upgrade Section */}
                    <Show when="signed-in">
                        {/* Use a loading check to avoid showing the button prematurely */}
                        {!isLoading && !userHasProAccess && (
                            <div className="sidebar__upgrade">
                                <UpgradeButton />
                            </div>
                        )}
                    </Show>
                </div>

                {onToggleCollapse && (
                    <div className="sidebar__rail-footer">
                        <button
                            className="sidebar__collapse-toggle"
                            onClick={onToggleCollapse}
                            aria-label={isCollapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
                            <span className="sidebar__collapse-label">Collapse</span>
                        </button>
                    </div>
                )}
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