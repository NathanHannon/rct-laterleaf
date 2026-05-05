export interface ThemeProviderProps {
    children: React.ReactNode;
}

export type AppearancePreference = 'light' | 'dark' | 'system';
export type ThemeType = 'default' | 'cherry-blossom' | 'midnight-ocean' | 'forest-moss' | 'nord-arctic' | 'neon-nights' | 'dark-coffee' | 'berry-red' | 'wild-strawberry';

export interface ThemeContextType {
    appearance: AppearancePreference;
    activeAppearance: 'light' | 'dark';
    theme: ThemeType;
    setAppearance: (appearance: AppearancePreference) => void;
    setTheme: (theme: ThemeType) => void;
    toggleAppearance: () => void;
}
