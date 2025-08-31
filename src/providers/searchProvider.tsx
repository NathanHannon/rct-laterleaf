import React, { useState, type ReactNode } from 'react';
import { SearchContext, type SearchContextType, type SearchMode } from '../context/searchContext';

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('keyword');

    const value: SearchContextType = {
        searchTerm,
        setSearchTerm,
        searchMode,
        setSearchMode,
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};