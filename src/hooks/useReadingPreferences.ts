import { useState, useEffect, useCallback } from 'react';

export type ReadingFont =
    | 'system'
    | 'inter'
    | 'literata'
    | 'lora'
    | 'merriweather'
    | 'source-serif'
    | 'ibm-plex-sans'
    | 'atkinson'
    | 'jetbrains-mono'
    | 'openDyslexic';

export type ReadingTheme = 'default' | 'sepia' | 'black';

export interface ReadingFontOption {
    id: ReadingFont;
    name: string;
    category: 'sans-serif' | 'serif' | 'monospace' | 'accessibility';
    cssFamily: string;
    description: string;
}

export const READING_FONTS: ReadingFontOption[] = [
    {
        id: 'system',
        name: 'System Default',
        category: 'sans-serif',
        cssFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        description: 'Uses your device\'s native font',
    },
    {
        id: 'inter',
        name: 'Inter',
        category: 'sans-serif',
        cssFamily: '"Inter", sans-serif',
        description: 'Clean and modern, optimized for screens',
    },
    {
        id: 'literata',
        name: 'Literata',
        category: 'serif',
        cssFamily: '"Literata", serif',
        description: 'Designed for long-form reading on screens',
    },
    {
        id: 'lora',
        name: 'Lora',
        category: 'serif',
        cssFamily: '"Lora", serif',
        description: 'Calligraphic serif, great for body text',
    },
    {
        id: 'merriweather',
        name: 'Merriweather',
        category: 'serif',
        cssFamily: '"Merriweather", serif',
        description: 'Designed to be pleasant to read on screens',
    },
    {
        id: 'source-serif',
        name: 'Source Serif',
        category: 'serif',
        cssFamily: '"Source Serif 4", serif',
        description: 'Adobe\'s open-source editorial serif',
    },
    {
        id: 'ibm-plex-sans',
        name: 'IBM Plex Sans',
        category: 'sans-serif',
        cssFamily: '"IBM Plex Sans", sans-serif',
        description: 'Neutral and friendly, excellent readability',
    },
    {
        id: 'atkinson',
        name: 'Atkinson Hyperlegible',
        category: 'accessibility',
        cssFamily: '"Atkinson Hyperlegible Next", sans-serif',
        description: 'Maximizes character distinction for low vision',
    },
    {
        id: 'jetbrains-mono',
        name: 'JetBrains Mono',
        category: 'monospace',
        cssFamily: '"JetBrains Mono", monospace',
        description: 'Developer-friendly monospace with ligatures',
    },
    {
        id: 'openDyslexic',
        name: 'OpenDyslexic',
        category: 'accessibility',
        cssFamily: '"OpenDyslexic", sans-serif',
        description: 'Weighted bottoms help reduce letter confusion',
    },
];

const STORAGE_KEY_FONT = 'readingFont';
const STORAGE_KEY_THEME = 'readingTheme';

// Custom event for cross-component sync
const READING_PREFS_EVENT = 'laterleaf_reading_prefs_changed';

export function useReadingPreferences() {
    const [readingFont, setReadingFontState] = useState<ReadingFont>(() => {
        return (localStorage.getItem(STORAGE_KEY_FONT) as ReadingFont) || 'system';
    });

    const [readingTheme, setReadingThemeState] = useState<ReadingTheme>(() => {
        return (localStorage.getItem(STORAGE_KEY_THEME) as ReadingTheme) || 'default';
    });

    const setReadingFont = useCallback((font: ReadingFont) => {
        setReadingFontState(font);
        localStorage.setItem(STORAGE_KEY_FONT, font);
        window.dispatchEvent(new Event(READING_PREFS_EVENT));
    }, []);

    const setReadingTheme = useCallback((theme: ReadingTheme) => {
        setReadingThemeState(theme);
        localStorage.setItem(STORAGE_KEY_THEME, theme);
        window.dispatchEvent(new Event(READING_PREFS_EVENT));
    }, []);

    // Listen for changes from other components
    useEffect(() => {
        const handleChange = () => {
            const font = (localStorage.getItem(STORAGE_KEY_FONT) as ReadingFont) || 'system';
            const theme = (localStorage.getItem(STORAGE_KEY_THEME) as ReadingTheme) || 'default';
            setReadingFontState(font);
            setReadingThemeState(theme);
        };

        window.addEventListener(READING_PREFS_EVENT, handleChange);
        return () => window.removeEventListener(READING_PREFS_EVENT, handleChange);
    }, []);

    const currentFontOption = READING_FONTS.find(f => f.id === readingFont) || READING_FONTS[0];

    return {
        readingFont,
        readingTheme,
        setReadingFont,
        setReadingTheme,
        currentFontOption,
        fontOptions: READING_FONTS,
    };
}
