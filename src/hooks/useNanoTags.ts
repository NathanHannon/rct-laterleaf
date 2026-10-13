import { useState, useCallback, useEffect } from 'react';
import { checkNanoAvailability, suggestTagsForArticle } from '../services/nanoAiService';

export const useNanoTags = () => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

    // Initial check for API presence on mount
    useEffect(() => {
        checkNanoAvailability().then(available => {
            setIsAvailable(available);
        });
    }, []);

    const generateTags = useCallback(async (title: string, excerpt: string, count: number = 3) => {
        if (!isAvailable) return [];

        setIsLoading(true);
        try {
            const tags = await suggestTagsForArticle(title, excerpt, count);
            setSuggestions(tags);
            return tags;
        } finally {
            setIsLoading(false);
        }
    }, [isAvailable]);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);

    return {
        suggestions,
        isLoading,
        isAvailable,
        generateTags,
        clearSuggestions
    };
};
