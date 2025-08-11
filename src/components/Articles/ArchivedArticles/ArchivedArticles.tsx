import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ArticleCard from '../ArticleCard/ArticleCard';
import './ArchivedArticles.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ArchivedArticles: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);

    const fetchArticles = async () => {
        try {
            const token = await getToken();
            const filter = encodeURIComponent(JSON.stringify({ where: { isArchived: true } }));
            const response = await fetch(`/api/articles?filter=${filter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response was not ok: ${errorText}`);
            }

            const data: Article[] = await response.json();
            setArticles(data);
        } catch (error) {
            console.error("Failed to fetch archived articles:", error);
        }
    };

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchArticles();
        }
    }, [isLoaded, isSignedIn]);

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
            // Since this is the archive page, un-archiving should remove it from the list
            setArticles(prev => prev.filter(a => a.id !== articleId));
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
        return <div className="loading-container"><FontAwesomeIcon icon={faSpinner} spin size="3x" /></div>;
    }

    if (!isSignedIn) {
        return <div>Please sign in to see your articles.</div>;
    }

    return (
        <div className="article-list-container">
            <h2 className="list-title">Archived Articles</h2>
            <div className="article-grid">
                {articles.filter(article => article.id).map(article => (
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

export default ArchivedArticles; 