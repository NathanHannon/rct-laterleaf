import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowLeft, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import { useCollectionAnimation } from '../../../hooks/useCollectionAnimation';
import ArticleCard from '../../Articles/ArticleCard/ArticleCard';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import type { Article } from '../../../interfaces/article';
import './CollectionView.scss';
import type { Collection } from '../../../interfaces/collection';

const CollectionView: React.FC = () => {
    const { collectionId } = useParams<{ collectionId: string }>();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const navigate = useNavigate();
    const { triggerImplode } = useCollectionAnimation();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [allUserArticles, setAllUserArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [removeConfirm, setRemoveConfirm] = useState<{ show: boolean; articleId: string; articleTitle: string }>({
        show: false, articleId: '', articleTitle: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; articleId: string; articleTitle: string }>({
        show: false, articleId: '', articleTitle: ''
    });
    // const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const fetchCollection = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`/api/collections/${collectionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch collection');
            }

            const data = await response.json();
            setCollection(data);
        } catch (error) {
            console.error('Failed to fetch collection:', error);
        }
    };

    const fetchCollectionArticles = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`/api/collections/${collectionId}/articles`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch collection articles');
            }

            const data = await response.json();
            setArticles(data);
        } catch (error) {
            console.error('Failed to fetch collection articles:', error);
        }
    };

    const fetchAllUserArticles = async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/articles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user articles');
            }

            const data = await response.json();
            setAllUserArticles(data);
        } catch (error) {
            console.error('Failed to fetch user articles:', error);
        }
    };

    useEffect(() => {
        if (isLoaded && isSignedIn && collectionId) {
            Promise.all([
                fetchCollection(),
                fetchCollectionArticles(),
                fetchAllUserArticles()
            ]).finally(() => setLoading(false));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, collectionId]);

    const handleAddArticleToCollection = async (articleId: string) => {
        try {
            const token = await getToken();
            const response = await fetch(`/api/collections/${collectionId}/link-article`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ articleId })
            });

            if (!response.ok) {
                throw new Error('Failed to add article to collection');
            }

            fetchCollectionArticles();
        } catch (error) {
            console.error('Failed to add article to collection:', error);
        }
    };

    const handleRemoveArticleFromCollection = async (articleId: string) => {
        const article = articles.find(a => a.id === articleId);
        setRemoveConfirm({
            show: true,
            articleId,
            articleTitle: article?.title || 'this article'
        });
    };

    const confirmRemoveArticle = async () => {
        if (!removeConfirm.articleId) return;

        try {
            const token = await getToken();
            const response = await fetch(`/api/collections/${collectionId}/unlink-article/${removeConfirm.articleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to remove article from collection');
            }

            setArticles(prev => prev.filter(article => article.id !== removeConfirm.articleId));
            setRemoveConfirm({ show: false, articleId: '', articleTitle: '' });
        } catch (error) {
            console.error('Failed to remove article from collection:', error);
            setRemoveConfirm({ show: false, articleId: '', articleTitle: '' });
        }
    };

    const handleArticleAction = async (articleId: string, endpoint: string, method: 'POST' | 'DELETE' = 'POST') => {
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
        const article = articles.find(a => a.id === articleId);
        setDeleteConfirm({
            show: true,
            articleId,
            articleTitle: article?.title || 'this article'
        });
    };

    const confirmDeleteArticle = async () => {
        if (!deleteConfirm.articleId) return;

        const success = await handleArticleAction(deleteConfirm.articleId, '', 'DELETE');
        if (success) {
            setArticles(prev => prev.filter(a => a.id !== deleteConfirm.articleId));
            setAllUserArticles(prev => prev.filter(a => a.id !== deleteConfirm.articleId));
        }
        setDeleteConfirm({ show: false, articleId: '', articleTitle: '' });
    };

    const handleArchive = async (articleId: string) => {
        const success = await handleArticleAction(articleId, 'archive');
        if (success) {
            setArticles(prev => prev.map(a =>
                a.id === articleId ? { ...a, isArchived: !a.isArchived } : a
            ));
        }
    };

    const handleToggleBookmark = async (articleId: string) => {
        const success = await handleArticleAction(articleId, 'bookmark');
        if (success) {
            setArticles(prev => prev.map(a =>
                a.id === articleId ? { ...a, isBookmarked: !a.isBookmarked } : a
            ));
        }
    };

    // Get articles not in this collection
    const availableArticles = allUserArticles.filter(article =>
        !articles.some(collectionArticle => collectionArticle.id === article.id)
    );

    const handleBackToCollections = () => {
        triggerImplode();
        setTimeout(() => {
            navigate('/collections');
        }, 400);
    };

    if (!isLoaded || loading) {
        return (
            <div className="loading-container">
                <FontAwesomeIcon icon={faSpinner} spin size="3x" />
            </div>
        );
    }

    if (!isSignedIn) {
        return <div>Please sign in to view your collections.</div>;
    }

    if (!collection) {
        return <div>Collection not found.</div>;
    }

    return (
        <div className="collection-view-container">
            <div className="collection-header">
                <button onClick={handleBackToCollections} className="back-button">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Collections
                </button>
                <div className="collection-info">
                    <motion.h1
                        layoutId={`collection-title-${collectionId}`}
                    >
                        {collection.name}
                    </motion.h1>
                    {collection.description && (
                        <motion.p
                            className="collection-description"
                            layoutId={`collection-description-${collectionId}`}
                        >
                            {collection.description}
                        </motion.p>
                    )}
                    <motion.span
                        className="article-count"
                        layoutId={`collection-count-${collectionId}`}
                    >
                        {articles.length} articles
                    </motion.span>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="add-article-btn"
                    disabled={availableArticles.length === 0}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Articles
                </button>
            </div>

            <motion.div
                className="articles-grid"
                layout
            >
                {articles.map((article) => (
                    <motion.div
                        key={article.id}
                        className="collection-article-wrapper"
                        layoutId={`article-${article.id}-full`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 0.5,
                            delay: articles.indexOf(article) * 0.1
                        }}
                    >
                        <ArticleCard
                            article={article}
                            onDelete={handleDelete}
                            onArchive={handleArchive}
                            onToggleBookmark={handleToggleBookmark}
                        />
                        <button
                            onClick={() => handleRemoveArticleFromCollection(article.id!)}
                            className="remove-from-collection-btn"
                            title="Remove from collection"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </motion.div>
                ))}
            </motion.div>

            {articles.length === 0 && (
                <div className="empty-collection">
                    <h3>This collection is empty</h3>
                    <p>Add some articles to get started!</p>
                    <button onClick={() => setShowAddModal(true)} className="add-article-btn">
                        <FontAwesomeIcon icon={faPlus} />
                        Add Articles
                    </button>
                </div>
            )}

            {/* Add Articles Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            className="modal-content add-articles-modal"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>Add Articles to Collection</h2>
                            <div className="available-articles">
                                {availableArticles.length === 0 ? (
                                    <p>No additional articles available to add.</p>
                                ) : (
                                    availableArticles.map((article) => (
                                        <div key={article.id} className="article-option">
                                            <div className="article-info">
                                                <h4>{article.title}</h4>
                                                <p>{article.excerpt}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    handleAddArticleToCollection(article.id!);
                                                    setShowAddModal(false);
                                                }}
                                                className="add-btn"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setShowAddModal(false)}>Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmationDialog
                isOpen={removeConfirm.show}
                onConfirm={confirmRemoveArticle}
                onCancel={() => setRemoveConfirm({ show: false, articleId: '', articleTitle: '' })}
                title="Remove Article"
                message={`Remove "${removeConfirm.articleTitle}" from this collection?`}
                variant="warning"
            />

            <ConfirmationDialog
                isOpen={deleteConfirm.show}
                onConfirm={confirmDeleteArticle}
                onCancel={() => setDeleteConfirm({ show: false, articleId: '', articleTitle: '' })}
                title="Delete Article"
                message={`Are you sure you want to delete "${deleteConfirm.articleTitle}"? This will delete the article entirely.`}
                variant="danger"
            />
        </div>
    );
};

export default CollectionView;