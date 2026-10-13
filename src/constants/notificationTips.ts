export const TIP_STORAGE_KEYS = {
    commandPalette: 'laterleaf_tip_command_palette',
    extensionImport: 'laterleaf_tip_extension_import',
    feedsRefresh: 'laterleaf_tip_feeds_refresh',
    exportFormats: 'laterleaf_tip_export_formats',
} as const;

export function getKeyboardShortcutLabel(): string {
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')) {
        return '⌘K';
    }

    return 'Ctrl+K';
}

export function hasSeenTip(key: string): boolean {
    if (typeof window === 'undefined') {
        return true;
    }

    return window.localStorage.getItem(key) === 'true';
}

export function markTipSeen(key: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(key, 'true');
}

export const notificationTips = {
    commandPalette: {
        title: 'Pro tip',
        message: (shortcut: string) => `Press ${shortcut} to quickly navigate, search, and run actions.`,
    },
    extensionImport: {
        title: 'Extension tip',
        message: 'The LaterLeaf browser extension usually works better on paywalled or JavaScript-heavy pages.',
    },
    feedsRefresh: {
        title: 'Feed tip',
        message: 'RSS feeds refresh automatically in the background, so recurring sources stay current without manual work.',
    },
    exportFormats: {
        title: 'Export tip',
        message: 'Use CSV for spreadsheets, HTML bookmarks for browsers and Pocket-style tools, and JSON for automation.',
    },
} as const;