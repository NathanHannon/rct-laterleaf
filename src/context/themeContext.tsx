import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { ThemeProviderProps, ThemeContextType, ThemePreference } from '../interfaces/props/theme-props';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme, setTheme] = useState<ThemePreference>(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
            return storedTheme as ThemePreference;
        }
        return 'system';
    });

    const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateActiveTheme = () => {
            if (theme === 'system') {
                setActiveTheme(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setActiveTheme(theme);
            }
        };

        updateActiveTheme();

        // Listen for system theme changes
        const listener = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                setActiveTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', activeTheme);
        localStorage.setItem('theme', theme);
    }, [activeTheme, theme]);

    const setThemePreference = (newTheme: ThemePreference) => {
        setTheme(newTheme);
    };

    const toggleTheme = () => {
        // Simple toggle cycles through: system -> light -> dark -> system
        setTheme(prevTheme => {
            if (prevTheme === 'system') return 'light';
            if (prevTheme === 'light') return 'dark';
            return 'system';
        });
    };

    const value = useMemo(() => ({ theme, activeTheme, setThemePreference, toggleTheme }), [theme, activeTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
