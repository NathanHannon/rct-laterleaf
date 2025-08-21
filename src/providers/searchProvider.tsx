import React, { useState, type ReactNode } from 'react';
import { SearchContext, type SearchContextType } from '../context/searchContext';

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const value: SearchContextType = {
        searchTerm,
        setSearchTerm
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};