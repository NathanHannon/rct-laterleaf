import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useCommandContext } from '../../context/commandContext';
import type { CommandItem } from '../../context/commandContext';
import {
    faInbox,
    faBookmark,
    faArchive,
    faFolderOpen,
    faGear,
    faMoon,
    faSun,
    faDesktop,
    faCompass,
    faRss
} from '@fortawesome/free-solid-svg-icons';

export default function GlobalCommands() {
    const navigate = useNavigate();
    const { setAppearance } = useTheme();
    const { registerCommand, unregisterCommand } = useCommandContext();

    useEffect(() => {
        const globalCommands: CommandItem[] = [
            { id: 'nav-inbox', label: 'Go to Library', icon: faInbox, action: () => navigate('/'), section: 'Navigation' },
            { id: 'nav-collections', label: 'Go to Collections', icon: faFolderOpen, action: () => navigate('/collections'), section: 'Navigation' },
            { id: 'nav-favorites', label: 'Go to Favorites', icon: faBookmark, action: () => navigate('/bookmarks'), section: 'Navigation' },
            { id: 'nav-archive', label: 'Go to Archive', icon: faArchive, action: () => navigate('/archive'), section: 'Navigation' },
            { id: 'nav-discover', label: 'Go to Discover', icon: faCompass, action: () => navigate('/discover'), section: 'Navigation' },
            { id: 'nav-feeds', label: 'Go to RSS Feeds', icon: faRss, action: () => navigate('/feeds'), section: 'Navigation' },
            { id: 'nav-settings', label: 'Go to Settings', icon: faGear, action: () => navigate('/settings'), section: 'Navigation' },

            { id: 'theme-light', label: 'Light Mode', icon: faSun, action: () => setAppearance('light'), section: 'Theme & Appearance' },
            { id: 'theme-dark', label: 'Dark Mode', icon: faMoon, action: () => setAppearance('dark'), section: 'Theme & Appearance' },
            { id: 'theme-system', label: 'System Theme', icon: faDesktop, action: () => setAppearance('system'), section: 'Theme & Appearance' }
        ];

        globalCommands.forEach(registerCommand);

        return () => {
            globalCommands.forEach(cmd => unregisterCommand(cmd.id));
        };
    }, [navigate, setAppearance, registerCommand, unregisterCommand]);

    return null; // This component handles context registration, minimal UI rendering
}
