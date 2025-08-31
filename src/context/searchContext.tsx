import { createContext } from 'react';

export type SearchMode = 'keyword' | 'semantic';

interface SearchContextType {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchMode: SearchMode;
    setSearchMode: (mode: SearchMode) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);
export type { SearchContextType };