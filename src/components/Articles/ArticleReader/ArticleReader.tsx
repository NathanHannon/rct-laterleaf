import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from 'motion/react';
import type { Article } from '../../../interfaces/article';
import './ArticleReader.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faArchive, faTrash, faMagicWandSparkles, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';

const ArticleReader = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);

    const handleFavorite = async () => {
        if (!articleId || !article) return;

        setIsBookmarkAnimating(true);
        setTimeout(() => setIsBookmarkAnimating(false), 600);

        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/bookmark`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to bookmark article');
            }
            // Update local state to reflect the change immediately
            setArticle(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleSummarize = async () => {
        if (!articleId || !article) return;

        // If summary already exists, just toggle display
        if (article.summary) {
            setShowSummary(!showSummary);
            return;
        }

        setIsGeneratingSummary(true);
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/summarize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate summary');
            }

            const data = await response.json();
            setArticle(prev => prev ? { ...prev, summary: data.summary } : null);
            setShowSummary(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate summary');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleRefreshSummary = async () => {
        if (!articleId || !article) return;

        setIsGeneratingSummary(true);
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/summarize?force=true`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate summary');
            }

            const data = await response.json();
            setArticle(prev => prev ? { ...prev, summary: data.summary } : null);
            setShowSummary(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to regenerate summary');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleArchive = async () => {
        if (!articleId || !article) return;
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/archive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to archive article');
            }
            // Update local state to reflect the change immediately
            setArticle(prev => prev ? { ...prev, isArchived: !prev.isArchived } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleDelete = async () => {
        if (!articleId) return;
        if (window.confirm('Are you sure you want to delete this article?')) {
            try {
                const token = await getToken();
                const response = await fetch(`/api/articles/${articleId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    navigate('/articles');
                } else {
                    throw new Error('Failed to delete article');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            }
        }
    };

    useEffect(() => {
        const fetchArticle = async () => {
            if (!articleId) return;

            try {
                setLoading(true);
                const token = await getToken();
                const response = await fetch(`/api/articles/${articleId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data: Article = await response.json();
                // console.log('ArticleReader received data:', {
                //     articleId: data.id,
                //     title: data.title,
                //     isBookmarked: data.isBookmarked,
                //     isArchived: data.isArchived
                // });
                setArticle(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [articleId, getToken]);

    if (loading) {
        return <div>Loading article...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!article) {
        return <div>Article not found.</div>;
    }

    return (
        <div className="article-reader">
            <div className="article-actions">
                <motion.button
                    onClick={handleFavorite}
                    className={`button-favorite ${article.isBookmarked ? 'favorited' : ''}`}
                    whileTap={{ scale: 0.95 }}
                    animate={isBookmarkAnimating ? {
                        scale: [1, 1.1, 1],
                        rotateZ: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.3 }}
                >
                    <FontAwesomeIcon icon={article.isBookmarked ? faBookmarkSolid : faBookmarkRegular} />
                    <span>{article.isBookmarked ? 'Remove' : 'Bookmark'}</span>
                </motion.button>

                <button
                    onClick={handleSummarize}
                    className={`button-summarize ${article.summary ? 'has-summary' : ''} ${isGeneratingSummary ? 'loading' : ''}`}
                    disabled={isGeneratingSummary}
                >
                    <FontAwesomeIcon icon={faMagicWandSparkles} />
                    <span>
                        {isGeneratingSummary ? 'Generating...' :
                            article.summary ? (showSummary ? 'Hide Summary' : 'Show Summary') :
                                'Summarize'}
                    </span>
                </button>

                <button onClick={handleArchive} className="button-archive">
                    <FontAwesomeIcon icon={faArchive} />
                    <span>{article.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <button onClick={handleDelete} className="button-delete">
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                </button>
            </div>

            <h1>{article.title}</h1>
            <div className="article-author">By {article.author || 'Unknown author'}</div>
            {article.publishedAt && <div className="article-date">Published on: {new Date(article.publishedAt).toLocaleDateString()}</div>}

            {/* AI Summary Panel */}
            <AnimatePresence>
                {showSummary && article.summary && (
                    <motion.div
                        className="ai-summary-panel"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '2rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="summary-header">
                            <div className="summary-title">
                                <h3>✨ AI Summary</h3>
                                <small>Generated by AI • Not editorial judgment</small>
                            </div>
                            <button
                                onClick={handleRefreshSummary}
                                className="refresh-summary-button"
                                disabled={isGeneratingSummary}
                                title="Regenerate summary"
                            >
                                <FontAwesomeIcon
                                    icon={faRotateRight}
                                    className={isGeneratingSummary ? 'spinning' : ''}
                                />
                            </button>
                        </div>
                        <div className="summary-content">
                            {article.summary}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="article-source">
                <p>This content is republished from <a href={article.url} target="_blank" rel="noopener noreferrer">the original source</a> for personal use. All rights belong to the original author and publisher.</p>
            </div>
            <hr />
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content || '' }}></div>
        </div>
    );
};

export default ArticleReader; 