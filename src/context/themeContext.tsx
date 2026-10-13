import { apiUrl } from '../constants/api';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import type { ThemeProviderProps, AppearancePreference, ThemeType } from '../interfaces/props/theme-props';
import { ThemeContext } from './themeContextDef';
export { ThemeContext } from './themeContextDef';



export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const { getToken, isSignedIn } = useAuth();

    const [appearance, setAppearanceInternal] = useState<AppearancePreference>(() => {
        const stored = localStorage.getItem('appearance');
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored as AppearancePreference;
        }
        return 'system';
    });

    const [theme, setThemeInternal] = useState<ThemeType>(() => {
        const stored = localStorage.getItem('theme');
        const validThemes: ThemeType[] = ['default', 'cherry-blossom', 'midnight-ocean', 'forest-moss', 'nord-arctic', 'neon-nights', 'dark-coffee', 'berry-red', 'wild-strawberry'];
        if (stored && validThemes.includes(stored as ThemeType)) {
            return stored as ThemeType;
        }
        return 'default';
    });

    const [activeAppearance, setActiveAppearance] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateActiveAppearance = () => {
            if (appearance === 'system') {
                setActiveAppearance(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setActiveAppearance(appearance as 'light' | 'dark');
            }
        };

        updateActiveAppearance();

        const listener = (e: MediaQueryListEvent) => {
            if (appearance === 'system') {
                setActiveAppearance(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, [appearance]);

    useEffect(() => {
        document.documentElement.setAttribute('data-appearance', activeAppearance);
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('appearance', appearance);
        localStorage.setItem('theme', theme);
    }, [activeAppearance, appearance, theme]);

    const setAppearance = (newAppearance: AppearancePreference) => {
        setAppearanceInternal(newAppearance);
        syncPreferences(newAppearance, theme);
    };

    const setTheme = (newTheme: ThemeType) => {
        setThemeInternal(newTheme);
        syncPreferences(appearance, newTheme);
    };

    const syncPreferences = async (app: AppearancePreference, thm: ThemeType) => {
        if (isSignedIn) {
            try {
                const token = await getToken();
                await fetch(apiUrl('/users/me/preferences'), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ appearance: app, theme: thm })
                });
            } catch (error) {
                console.error('Failed to sync preferences:', error);
            }
        }
    };

    const toggleAppearance = () => {
        setAppearanceInternal(prev => {
            const next = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
            syncPreferences(next, theme);
            return next;
        });
    };

    const value = useMemo(() => ({
        appearance,
        activeAppearance,
        theme,
        setAppearance,
        setTheme,
        toggleAppearance
    }), [appearance, activeAppearance, theme, setAppearance, setTheme, toggleAppearance]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
