export interface ThemeProviderProps {
    children: React.ReactNode;
}

export type AppearancePreference = 'light' | 'dark' | 'system';
export type ThemeType = 'default' | 'cherry-blossom' | 'midnight-ocean' | 'forest-moss' | 'retro-archive';

export interface ThemeContextType {
    appearance: AppearancePreference;
    activeAppearance: 'light' | 'dark';
    theme: ThemeType;
    setAppearance: (appearance: AppearancePreference) => void;
    setTheme: (theme: ThemeType) => void;
    toggleAppearance: () => void;
}
