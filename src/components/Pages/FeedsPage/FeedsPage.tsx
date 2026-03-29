import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@clerk/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlus, faRss } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../../interfaces/article';
import RecommendationCard from '../../Articles/RecommendationCard/RecommendationCard';
import ManageFeedsModal from './ManageFeedsModal';
import { useToast } from '../../../context/toastContext';
import { motion, type Variants } from 'motion/react';
import { usePostHog } from 'posthog-js/react';
import './FeedsPage.scss';

export interface RssFeed {
    id: string; // UserFeed junction ID
    feedId?: string; // Global Feed ID
    name: string;
    url: string;
    createdAt?: string;
}

export interface FeedArticle extends Article {
    feedId?: string;
    feedTitle?: string;
    feedUrl?: string;
}

export interface FeedItem {
    id: string;
    titleOverride?: string
    feed: {
        id: string;
        title: string;
        url: string;
        createdAt?: string;
    };
}

const FeedsPage: React.FC = () => {
    const { getToken } = useAuth();
    const { showSuccess, showError } = useToast();
    const posthog = usePostHog();
    const [feedArticles, setFeedArticles] = useState<FeedArticle[]>([]);
    const [feeds, setFeeds] = useState<RssFeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);

    const fetchFeeds = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/users/me/feeds', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch feeds');
            const data = await response.json();

            // Map UserFeed[] to RssFeed[]
            const mappedFeeds: RssFeed[] = data.map((item: FeedItem) => ({
                id: item.id, // We need the junction ID to delete it
                feedId: item.feed?.id,
                name: item.titleOverride || item.feed?.title || 'Unknown Feed',
                url: item.feed?.url || '',
                createdAt: item.feed?.createdAt
            }));

            setFeeds(mappedFeeds);
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
            const item = await response.json();
            const mappedNewFeed: RssFeed = {
                id: item.id,
                feedId: item.feed?.id,
                name: item.titleOverride || item.feed?.title || 'Unknown Feed',
                url: item.feed?.url || '',
                createdAt: item.feed?.createdAt
            };

            setFeeds(prev => [...prev, mappedNewFeed]);
            showSuccess('Feed Added!', `You're now subscribed to "${mappedNewFeed.name || url}".`);
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

            // Track the event
            posthog.capture('feed_article_added', {
                article_url: article.url,
                feed_title: article.feedTitle
            });

            setFeedArticles(prev => prev.filter(a => a.id !== articleId));
        } catch {
            showError('Error', 'Could not add article to your library.');
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' },
        visible: {
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

    const filteredArticles = selectedFeedId
        ? feedArticles.filter(article => article.feedId === selectedFeedId)
        : feedArticles;

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
            {feeds.length > 0 && (
                <div className="feeds-filters">
                    <button
                        className={`feed-filter-pill ${selectedFeedId === null ? 'active' : ''}`}
                        onClick={() => setSelectedFeedId(null)}
                    >
                        All Feeds
                    </button>
                    {feeds.map(feed => (
                        <button
                            key={feed.id}
                            className={`feed-filter-pill ${selectedFeedId === feed.feedId ? 'active' : ''}`}
                            onClick={() => setSelectedFeedId(selectedFeedId === feed.feedId ? null : (feed.feedId || null))}
                            title={feed.name || feed.url}
                        >
                            {feed.name && feed.name !== 'Unknown Feed' && feed.name !== feed.url
                                ? feed.name
                                : new URL(feed.url).hostname.replace(/^www\./, '')}
                        </button>
                    ))}
                </div>
            )}
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
            ) : filteredArticles.length === 0 ? (
                <div className="feeds-empty">
                    <h3>No new articles</h3>
                    <p>Your feeds haven't published anything new recently. Check back later!</p>
                </div>
            ) : (
                <motion.div
                    className="feeds-grid"
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
                    {filteredArticles.map((article) => (
                        <motion.div
                            key={article.id}
                            variants={itemVariants}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <RecommendationCard
                                article={article}
                                onAddToLibrary={handleAddToLibrary}
                                showSource={true}
                            />
                        </motion.div>
                    ))}
                </motion.div>
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
