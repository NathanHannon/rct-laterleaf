import type { SortOption } from '../interfaces/sort';
import type { Article } from '../interfaces/article';

export type { SortOption }; // Re-export for backward compatibility

export const sortArticles = (articles: Article[], sortBy: SortOption): Article[] => {
    if (!articles || !Array.isArray(articles)) {
        return [];
    }

    const sortedArticles = [...articles];

    switch (sortBy) {
        case 'newest-first':
            return sortedArticles.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });

        case 'oldest-first':
            return sortedArticles.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateA - dateB;
            });

        case 'alphabetical':
            return sortedArticles.sort((a, b) => {
                const titleA = (a.title || '').toLowerCase();
                const titleB = (b.title || '').toLowerCase();
                return titleA.localeCompare(titleB);
            });

        case 'alphabetical-reverse':
            return sortedArticles.sort((a, b) => {
                const titleA = (a.title || '').toLowerCase();
                const titleB = (b.title || '').toLowerCase();
                return titleB.localeCompare(titleA);
            });

        case 'bookmarks-first':
            return sortedArticles.sort((a, b) => {
                // Sort bookmarked items first, then by creation date
                if (a.isBookmarked && !b.isBookmarked) return -1;
                if (!a.isBookmarked && b.isBookmarked) return 1;
                // If both have same bookmark status, sort by newest first
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });

        default:
            return sortedArticles;
    }
};
