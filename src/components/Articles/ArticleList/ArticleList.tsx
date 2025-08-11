import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import ArticleCard from '../ArticleCard/ArticleCard';
import './ArticleList.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCrown } from '@fortawesome/free-solid-svg-icons';
import AddArticleForm from '../AddArticleForm/AddArticleForm';
import { useSearch } from '../../../hooks/searchHook';

const ArticleList: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const { searchTerm } = useSearch();
    const [articles, setArticles] = useState<Article[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Check for Pro access using feature flags
    const hasProAccess = Array.isArray(user?.publicMetadata?.features) && user.publicMetadata.features.includes('full_library_search');

    const fetchArticles = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/articles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response was not ok: ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetch articles response:', data);

            const articlesArray = Array.isArray(data) ? data : [];
            setArticles(articlesArray);
        } catch (error) {
            console.error("Failed to fetch articles:", error);
            setArticles([]);
        }
    }, [getToken]);

    // Separate effect for search
    useEffect(() => {
        const performSearch = async () => {
            if (!isLoaded || !isSignedIn) return;

            if (!searchTerm) {
                fetchArticles();
                return;
            }

            setIsSearching(true);
            try {
                const token = await getToken();
                const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const searchResults = await response.json();
                console.log('Search response:', searchResults);
                console.log('First search result:', searchResults[0]); // Check what fields are included

                const resultsArray = Array.isArray(searchResults) ? searchResults :
                    (searchResults.results && Array.isArray(searchResults.results)) ? searchResults.results : [];

                console.log('Processed results array:', resultsArray);
                console.log('First processed result:', resultsArray[0]);

                setArticles(resultsArray);
            } catch (error) {
                console.error("Failed to perform search:", error);
                fetchArticles();
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [searchTerm, isLoaded, isSignedIn, fetchArticles, getToken]);

    // Initial fetch - only run once when component mounts and user is ready
    useEffect(() => {
        if (isLoaded && isSignedIn && !searchTerm) {
            fetchArticles();
        }
    }, [isLoaded, isSignedIn, fetchArticles, searchTerm]);

    const handleAction = async (articleId: string, endpoint: string, method: 'POST' | 'DELETE' = 'POST') => {
        try {
            const token = await getToken();
            const url = endpoint ? `/api/articles/${articleId}/${endpoint}` : `/api/articles/${articleId}`;
            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Action failed: ${endpoint}`);
            return true;
        } catch (error) {
            console.error(`Failed to ${endpoint || 'delete'}:`, error);
            return false;
        }
    };

    const handleDelete = async (articleId: string) => {
        if (window.confirm('Are you sure?')) {
            const success = await handleAction(articleId, '', 'DELETE');
            if (success) setArticles(prev => prev.filter(a => a.id !== articleId));
        }
    };

    const handleArchive = async (articleId: string) => {
        const success = await handleAction(articleId, 'archive');
        if (success) {
            setArticles(prev => prev.map(a =>
                a.id === articleId ? { ...a, isArchived: !a.isArchived } : a
            ));
        }
    };

    const handleToggleFavorite = async (articleId: string) => {
        const success = await handleAction(articleId, 'favorite');
        if (success) {
            setArticles(prev => prev.map(a =>
                a.id === articleId ? { ...a, isBookmarked: !a.isBookmarked } : a
            ));
        }
    };

    if (!isLoaded) {
        return <div className="loading-container"><FontAwesomeIcon icon={faSpinner} spin size="3x" /> Loading...</div>;
    }

    if (!isSignedIn) {
        return <div>Please sign in to see your articles.</div>;
    }

    const validArticles = Array.isArray(articles) ? articles : [];

    return (
        <div className="article-list-container">
            <AddArticleForm onArticleAdded={fetchArticles} />
            <div className="list-header">
                <h2 className="list-title">My List</h2>
                {hasProAccess && <span className="premium-badge">Pro Search Enabled <FontAwesomeIcon icon={faCrown} className="premium-icon" /></span>}
                {isSearching && <><FontAwesomeIcon icon={faSpinner} spin /> Searching...</>}
            </div>
            <div className="article-grid">
                {validArticles.filter(article => article.id).map(article => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                        onDelete={handleDelete}
                        onArchive={handleArchive}
                        onToggleFavorite={handleToggleFavorite}
                    />
                ))}
            </div>
        </div>
    );
};

export default ArticleList;