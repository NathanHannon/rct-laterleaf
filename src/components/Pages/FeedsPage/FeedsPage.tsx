import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlus, faRss } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../../interfaces/article';
import RecommendationCard from '../../Articles/RecommendationCard/RecommendationCard';
import ManageFeedsModal from './ManageFeedsModal';
import { useToast } from '../../../context/toastContext';
import { motion, type Variants, AnimatePresence } from 'motion/react';
import './FeedsPage.scss';

export interface RssFeed {
    id: string;
    name: string;
    url: string;
    createdAt?: string;
}

const FeedsPage: React.FC = () => {
    const { getToken } = useAuth();
    const { showSuccess, showError } = useToast();
    const [feedArticles, setFeedArticles] = useState<Article[]>([]);
    const [feeds, setFeeds] = useState<RssFeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManageOpen, setIsManageOpen] = useState(false);

    const fetchFeeds = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/users/me/feeds', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch feeds');
            const data = await response.json();
            setFeeds(data);
        } catch {
            // Silently fail — feeds list is secondary
        }
    }, [getToken]);

    const fetchFeedArticles = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/users/me/feed-articles', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch feed articles');
            const data = await response.json();
            setFeedArticles(data);
        } catch {
            showError('Error', 'Could not load your feed articles.');
        } finally {
            setIsLoading(false);
        }
    }, [getToken, showError]);

    useEffect(() => {
        fetchFeeds();
        fetchFeedArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddFeed = async (url: string) => {
        try {
            const token = await getToken();
            const response = await fetch('/api/users/me/feeds', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || 'Failed to add feed');
            }
            const newFeed = await response.json();
            setFeeds(prev => [...prev, newFeed]);
            showSuccess('Feed Added!', `You're now subscribed to "${newFeed.name || url}".`);
            // Refresh articles to include the new feed
            fetchFeedArticles();
        } catch {
            showError('Could not add feed', 'Please check the URL and try again.');
        }
    };

    const handleRemoveFeed = async (feedId: string) => {
        try {
            const token = await getToken();
            const response = await fetch(`/api/users/me/feeds/${feedId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to remove feed');
            setFeeds(prev => prev.filter(f => f.id !== feedId));
            showSuccess('Feed Removed', 'You have unsubscribed from this feed.');
            fetchFeedArticles();
        } catch {
            showError('Error', 'Could not remove the feed.');
        }
    };

    const handleAddToLibrary = async (articleId: string) => {
        const article = feedArticles.find(a => a.id === articleId);
        if (!article?.url) {
            showError('Could not add article', 'Article data is missing.');
            return;
        }

        try {
            const token = await getToken();
            const response = await fetch('/api/articles/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ url: article.url }),
            });
            if (!response.ok) throw new Error('Failed to add article to library');
            showSuccess('Article Added!', `"${article.title}" has been saved to your library.`);
            setFeedArticles(prev => prev.filter(a => a.id !== articleId));
        } catch {
            showError('Error', 'Could not add article to your library.');
        }
    };

    const itemVariants: Variants = {
        initial: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' },
        animate: {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
        },
        exit: {
            opacity: 0, scale: 0.95, filter: 'blur(4px)',
            transition: { duration: 0.3 },
        },
    };

    const headerVariants: Variants = {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } },
    };

    if (isLoading) {
        return (
            <div className="feeds-page-loading">
                <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                <span>Loading your feeds...</span>
            </div>
        );
    }

    return (
        <div className="feeds-page">
            <motion.div
                className="feeds-header"
                initial="initial"
                animate="animate"
                variants={headerVariants}
            >
                <div className="feeds-header__text">
                    <h1>Your Feeds</h1>
                    <p>Articles from the RSS feeds you follow. Save the ones that interest you.</p>
                </div>
                <button
                    className="manage-feeds-button"
                    onClick={() => setIsManageOpen(true)}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Manage Feeds
                </button>
            </motion.div>

            {feeds.length === 0 ? (
                <motion.div
                    className="feeds-empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <FontAwesomeIcon icon={faRss} className="empty-icon" />
                    <h3>No feeds yet</h3>
                    <p>Subscribe to RSS feeds to see articles here. Your library stays clean — only articles you save will appear there.</p>
                    <button
                        className="manage-feeds-button"
                        onClick={() => setIsManageOpen(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Add Your First Feed
                    </button>
                </motion.div>
            ) : feedArticles.length === 0 ? (
                <div className="feeds-empty">
                    <h3>No new articles</h3>
                    <p>Your feeds haven't published anything new recently. Check back later!</p>
                </div>
            ) : (
                <div className="feeds-grid">
                    <AnimatePresence>
                        {feedArticles.map((article, index) => (
                            <motion.div
                                key={article.id}
                                variants={itemVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                whileHover={{
                                    y: -10,
                                    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                    delay: (index % 12) * 0.07,
                                    ease: [0.23, 1, 0.32, 1],
                                }}
                            >
                                <RecommendationCard
                                    article={article}
                                    onAddToLibrary={handleAddToLibrary}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <ManageFeedsModal
                isOpen={isManageOpen}
                onClose={() => setIsManageOpen(false)}
                feeds={feeds}
                onAddFeed={handleAddFeed}
                onRemoveFeed={handleRemoveFeed}
            />
        </div>
    );
};

export default FeedsPage;
