import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import ArticleCard from '../ArticleCard/ArticleCard';
import './BookmarkedArticles.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const BookmarkedArticles: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);

    const fetchArticles = useCallback(async () => {
        try {
            const token = await getToken();
            const filter = encodeURIComponent(JSON.stringify({ where: { isBookmarked: true } }));
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
            console.error("Failed to fetch favorited articles:", error);
        }
    }, [getToken]);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchArticles();
        }
    }, [isLoaded, isSignedIn, fetchArticles]);

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

    const handleToggleBookmark = async (articleId: string) => {
        const success = await handleAction(articleId, 'favorite');
        if (success) {
            // Un-favoriting should remove it from this list
            setArticles(prev => prev.filter(a => a.id !== articleId));
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
            <h2 className="list-title">Bookmarked Articles</h2>
            <motion.div
                className="article-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {articles.filter(article => article.id).map((article) => (
                    <motion.div
                        key={article.id}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                        }}
                        transition={{ duration: 0.4 }}
                    >
                        <ArticleCard
                            article={article}
                            onDelete={handleDelete}
                            onArchive={handleArchive}
                            onToggleBookmark={handleToggleBookmark}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default BookmarkedArticles; 