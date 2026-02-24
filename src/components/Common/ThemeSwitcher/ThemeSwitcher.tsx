import React from 'react';
import { useTheme } from '../../../context/themeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faDesktop } from '@fortawesome/free-solid-svg-icons';
import './ThemeSwitcher.scss';

const ThemeSwitcher: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    const getIcon = () => {
        if (theme === 'system') return faDesktop;
        if (theme === 'light') return faSun;
        return faMoon;
    };

    return (
        <button onClick={toggleTheme} className="theme-switcher" aria-label="Toggle theme">
            <FontAwesomeIcon icon={getIcon()} />
        </button>
    );
};

export default ThemeSwitcher;
