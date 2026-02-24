export interface ThemeProviderProps {
    children: React.ReactNode;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeContextType {
    theme: ThemePreference;
    activeTheme: 'light' | 'dark';
    setThemePreference: (theme: ThemePreference) => void;
    toggleTheme: () => void;
}
