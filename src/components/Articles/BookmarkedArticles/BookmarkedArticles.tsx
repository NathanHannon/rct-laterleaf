import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import ArticleCard from '../ArticleCard/ArticleCard';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import './BookmarkedArticles.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const BookmarkedArticles: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const queryClient = useQueryClient();
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; articleId: string | null }>({
        show: false,
        articleId: null
    });

    const { data: articles = [] } = useQuery({
        queryKey: ['articles', 'bookmarked'],
        queryFn: async () => {
            const token = await getToken();
            const filter = encodeURIComponent(JSON.stringify({ where: { isBookmarked: true } }));
            const response = await fetch(`/api/articles?filter=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch bookmarked articles');
            return response.json() as Promise<Article[]>;
        },
        enabled: isLoaded && !!isSignedIn,
    });

    const actionMutation = useMutation({
        mutationFn: async ({ articleId, endpoint, method = 'POST' }: { articleId: string; endpoint: string; method?: 'POST' | 'DELETE' }) => {
            const token = await getToken();
            const url = endpoint ? `/api/articles/${articleId}/${endpoint}` : `/api/articles/${articleId}`;
            const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error(`Action failed: ${endpoint}`);
        },
    });

    const handleDelete = (articleId: string) => {
        setDeleteConfirm({ show: true, articleId });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.articleId) return;
        actionMutation.mutate(
            { articleId: deleteConfirm.articleId, endpoint: '', method: 'DELETE' },
            {
                onSuccess: () => {
                    queryClient.setQueryData(['articles', 'bookmarked'], (old: Article[] | undefined) =>
                        old ? old.filter(a => a.id !== deleteConfirm.articleId) : []
                    );
                },
            }
        );
        setDeleteConfirm({ show: false, articleId: null });
    };

    const handleArchive = (articleId: string) => {
        actionMutation.mutate(
            { articleId, endpoint: 'archive' },
            {
                onSuccess: () => {
                    queryClient.setQueryData(['articles', 'bookmarked'], (old: Article[] | undefined) =>
                        old ? old.map(a => a.id === articleId ? { ...a, isArchived: !a.isArchived } : a) : []
                    );
                },
            }
        );
    };

    const handleToggleBookmark = (articleId: string) => {
        actionMutation.mutate(
            { articleId, endpoint: 'bookmark' },
            {
                onSuccess: () => {
                    queryClient.setQueryData(['articles', 'bookmarked'], (old: Article[] | undefined) =>
                        old ? old.filter(a => a.id !== articleId) : []
                    );
                },
            }
        );
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