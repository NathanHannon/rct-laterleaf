import React from 'react';
import { useTheme } from '../../../hooks/useTheme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faDesktop } from '@fortawesome/free-solid-svg-icons';
import './ThemeSwitcher.scss';

const ThemeSwitcher: React.FC = () => {
    const { appearance, toggleAppearance } = useTheme();

    const getIcon = () => {
        if (appearance === 'system') return faDesktop;
        if (appearance === 'light') return faSun;
        return faMoon;
    };

    return (
        <button onClick={toggleAppearance} className={`theme-switcher theme-switcher--${appearance}`} aria-label="Toggle appearance">
            <FontAwesomeIcon icon={getIcon()} />
        </button>
    );
};

export default ThemeSwitcher;
