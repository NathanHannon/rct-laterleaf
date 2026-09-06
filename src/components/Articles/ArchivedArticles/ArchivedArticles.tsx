import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import ArticleCard from '../ArticleCard/ArticleCard';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import './ArchivedArticles.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useArticleActions } from '../../../hooks/useArticleActions';
import '../ArticleList/ArticleList.scss';
import { Link } from 'react-router-dom';

const ArchivedArticles: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const actionMutation = useArticleActions();
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; articleId: string | null }>({
        show: false,
        articleId: null
    });

    const { data: articles = [], isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ['articles', 'archived'],
        queryFn: async () => {
            const token = await getToken();
            const filter = encodeURIComponent(JSON.stringify({ where: { isArchived: true } }));
            const response = await fetch(`/api/articles?filter=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch archived articles');
            return response.json() as Promise<Article[]>;
        },
        enabled: isLoaded && !!isSignedIn,
    });

    const handleDelete = (articleId: string) => setDeleteConfirm({ show: true, articleId });
    const confirmDelete = () => {
        if (!deleteConfirm.articleId || actionMutation.isPending) return;
        actionMutation.mutate({ articleId: deleteConfirm.articleId, action: 'delete' }, {
            onSuccess: () => setDeleteConfirm({ show: false, articleId: null }),
        });
    };
    const handleArchive = (articleId: string) => actionMutation.mutate({ articleId, action: 'archive' });
    const handleToggleBookmark = (articleId: string) => actionMutation.mutate({ articleId, action: 'bookmark' });

    if (!isLoaded || isLoading) {
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
                <div className="header-eyebrow">Vault</div>
                <h1 className="header-title">Archived Articles</h1>
                <div className="header-mesh"></div>
            </motion.header>

            <p className="library-results">Finished reads can live here. Restore an article whenever you want to return to it.</p>
            {isError && <section className="library-state" role="alert"><h2>We couldn’t load these articles.</h2><p>Please check your connection and try again.</p><button disabled={isFetching} onClick={() => { void refetch(); }}>{isFetching ? 'Trying again…' : 'Try again'}</button></section>}
            {!isError && articles.length === 0 && <section className="library-state"><h2>Room for your finished reads.</h2><p>Finished reads can live here. Restore an article whenever you want to return to it.</p><Link to="/articles">Back to your library</Link></section>}

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
                            isActionPending={actionMutation.isPending}
                        />
                    </motion.div>
                ))}
            </motion.div>

            <ConfirmationDialog
                isOpen={deleteConfirm.show}
                title="Delete Article"
                message="Are you sure you want to delete this article? This action cannot be undone."
                confirmText={actionMutation.isPending ? "Deleting…" : "Delete"}
                isPending={actionMutation.isPending}
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ show: false, articleId: null })}
            />
        </div>
    );
};

export default ArchivedArticles; 