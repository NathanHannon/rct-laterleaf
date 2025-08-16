export type SortOption =
    | 'newest-first'
    | 'oldest-first'
    | 'alphabetical'
    | 'alphabetical-reverse'
    | 'bookmarks-first';

export interface SortOptionConfig {
    value: SortOption;
    label: string;
    icon?: string;
}

export const SORT_OPTIONS: SortOptionConfig[] = [
    { value: 'newest-first', label: 'Newest First' },
    { value: 'oldest-first', label: 'Oldest First' },
    { value: 'alphabetical', label: 'A to Z' },
    { value: 'alphabetical-reverse', label: 'Z to A' },
    { value: 'bookmarks-first', label: 'Bookmarks First' }
];