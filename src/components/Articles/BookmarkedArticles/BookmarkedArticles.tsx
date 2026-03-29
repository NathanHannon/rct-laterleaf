import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@clerk/react";
import { motion } from 'motion/react';
import ArticleCard from '../ArticleCard/ArticleCard';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import './BookmarkedArticles.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const BookmarkedArticles: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; articleId: string | null }>({
        show: false,
        articleId: null
    });

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
            console.error("Failed to fetch bookmarked articles:", error);
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
        setDeleteConfirm({ show: true, articleId });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.articleId) return;
        const success = await handleAction(deleteConfirm.articleId, '', 'DELETE');
        if (success) setArticles(prev => prev.filter(a => a.id !== deleteConfirm.articleId));
        setDeleteConfirm({ show: false, articleId: null });
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
        // 🔧 FIX: Use 'bookmark' endpoint instead of 'favorite'
        const success = await handleAction(articleId, 'bookmark');
        if (success) {
            // Un-bookmarking should remove it from this list since this is the bookmarks page
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
            <motion.header
                className="premium-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
                <div className="header-eyebrow">Personal Collection</div>
                <h1 className="header-title">Bookmarked Articles</h1>
                <div className="header-mesh"></div>
            </motion.header>

            <motion.div
                key={articles.length > 0 ? 'loaded' : 'empty'}
                className="article-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.08,
                            delayChildren: 0.1
                        }
                    }
                }}
            >
                {articles.filter(article => article.id).map((article) => (
                    <motion.div
                        key={article.id}
                        variants={{
                            hidden: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' },
                            visible: {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                filter: 'blur(0px)',
                                transition: {
                                    duration: 0.6,
                                    ease: [0.23, 1, 0.32, 1]
                                }
                            }
                        }}
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

            <ConfirmationDialog
                isOpen={deleteConfirm.show}
                title="Delete Article"
                message="Are you sure you want to delete this article? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ show: false, articleId: null })}
            />
        </div>
    );
};

export default BookmarkedArticles;