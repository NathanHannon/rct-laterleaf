import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from "@clerk/react";
import RecommendationCard from '../../Articles/RecommendationCard/RecommendationCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSync, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../../interfaces/article';
import './DiscoverPage.scss';
import { useToast } from '../../../context/toastContext';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import RecommendationCarousel from '../../Recommendations/RecommendationCarousel/RecommendationCarousel';

const DiscoverPage: React.FC = () => {
    const { getToken, isSignedIn } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();
    const [recommendations, setRecommendations] = useState<Article[]>([]);
    const [discoveredArticles, setDiscoveredArticles] = useState<Article[]>([]);
    const [recommendationType, setRecommendationType] = useState<'personalized' | 'popular' | 'none'>('popular');
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [allRecommendationsLoaded, setAllRecommendationsLoaded] = useState(false);

    const fetchRecommendations = useCallback(async (isInitialFetch = false) => {
        if (!isSignedIn || isFetchingMore) return;

        setIsFetchingMore(true);
        if (isInitialFetch) {
            setIsLoading(true);
        }

        try {
            const token = await getToken();
            const previouslyRecommendedIds = isInitialFetch ? [] : recommendations.map(a => a.id);

            const response = await fetch(`/api/recommendations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ previouslyRecommendedIds }),
            });

            if (!response.ok) throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            const data = await response.json();

            if (data.type === 'none' || data.articles.length === 0) {
                setAllRecommendationsLoaded(true);
            } else {
                setRecommendations(prev => isInitialFetch ? data.articles : [...prev, ...data.articles]);
                setRecommendationType(data.type);
            }
        } catch {
            showError("Error", "Could not load recommendations.");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [getToken, isSignedIn, showError, recommendations, isFetchingMore]);

    useEffect(() => {
        // Initial fetch on mount
        fetchRecommendations(true);
        fetchDiscoveredArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once

    const fetchDiscoveredArticles = async () => {
        try {
            // This is a public endpoint, no token needed
            const response = await fetch('/api/curated-articles?limit=12');
            if (!response.ok) {
                throw new Error('Failed to fetch discovered articles');
            }
            const data = await response.json();
            setDiscoveredArticles(data);
        } catch (error) {
            console.error("Error fetching discovered articles:", error);
            // Silently fail, this section is not critical
        }
    };

    const handleAddToLibrary = async (articleId: string) => {
        const article = [...recommendations, ...discoveredArticles].find(rec => rec.id === articleId);
        if (!article || !article.url) {
            showError("Could not add article", "Article data is missing.");
            return;
        }

        try {
            const token = await getToken();
            const response = await fetch('/api/articles/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ url: article.url })
            });
            if (!response.ok) throw new Error('Failed to add article to library');
            showSuccess('Article Added!', `"${article.title}" has been saved to your library.`);
            setRecommendations(prev => prev.filter(rec => rec.id !== articleId));
            setDiscoveredArticles(prev => prev.filter(rec => rec.id !== articleId));
        } catch {
            showError("Error", "Could not add article to your library.");
        }
    };

    const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const handleDismiss = (articleId: string) => {
        // Capture the article before removing it so we can restore on undo
        const dismissed = [...recommendations, ...discoveredArticles].find(a => a.id === articleId);

        // Optimistically remove from UI
        setRecommendations(prev => prev.filter(rec => rec.id !== articleId));
        setDiscoveredArticles(prev => prev.filter(rec => rec.id !== articleId));

        // Schedule the actual API call
        const timer = setTimeout(async () => {
            dismissTimers.current.delete(articleId);
            try {
                const token = await getToken();
                await fetch('/api/recommendations/dismiss', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ articleId }),
                });
            } catch {
                // Silent — article already removed from UI
            }
        }, 6000);

        dismissTimers.current.set(articleId, timer);

        // Show toast with undo action
        showInfo('Article dismissed', undefined, 6000, {
            label: 'Undo',
            onClick: () => {
                // Cancel the pending API call
                const pending = dismissTimers.current.get(articleId);
                if (pending) {
                    clearTimeout(pending);
                    dismissTimers.current.delete(articleId);
                }
                // Restore the article
                if (dismissed) {
                    setRecommendations(prev => [...prev, dismissed]);
                }
            },
        });
    };

    // Cleanup pending timers on unmount
    useEffect(() => {
        return () => {
            dismissTimers.current.forEach(timer => clearTimeout(timer));
        };
    }, []);

    // We can simplify the variants. The container no longer needs to control staggering.
    const itemVariants: Variants = {
        initial: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            transition: {
                duration: 0.6,
                ease: [0.23, 1, 0.32, 1]
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            filter: 'blur(4px)',
            transition: { duration: 0.3 }
        },
    };

    const headerVariants: Variants = {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
    };

    const title = recommendationType === 'popular' ? 'Popular Articles' : 'Recommended for You';
    const subtitle = recommendationType === 'popular'
        ? "Here are some articles trending in the community."
        : "Based on your reading history, you might find these interesting.";

    if (isLoading) {
        return (
            <div className="discover-page-loading">
                <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                <span>Finding articles for you...</span>
            </div>
        );
    }

    return (
        <div className="discover-page">
            <motion.div
                className="discover-header"
                initial="initial"
                animate="animate"
                variants={headerVariants}
            >
                <h1>Discover New Articles</h1>
                <p>Find your next favorite read from the web and our community.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
                <RecommendationCarousel
                    title="New from Around the Web"
                    articles={discoveredArticles}
                    onAddToLibrary={handleAddToLibrary}
                    onDismiss={handleDismiss}
                />
            </motion.div>

            {recommendations.length > 0 ? (
                <>
                    <motion.div
                        className="discover-grid-header"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                    >
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </motion.div>
                    <div className="discover-grid">
                        <AnimatePresence>
                            {recommendations.filter(article => article && article.id).map((article, index) => (
                                <motion.div
                                    key={article.id}
                                    variants={itemVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    whileHover={{
                                        y: -10,
                                        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{
                                        delay: (index % 12) * 0.07,
                                        ease: [0.23, 1, 0.32, 1]
                                    }}
                                >
                                    <RecommendationCard
                                        article={article}
                                        onAddToLibrary={handleAddToLibrary}
                                        onDismiss={handleDismiss}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div className="discover-footer">
                        <button onClick={() => fetchRecommendations()} disabled={isFetchingMore || allRecommendationsLoaded} className="load-more-button">
                            {isFetchingMore ? (
                                <><FontAwesomeIcon icon={faSpinner} spin /> Loading...</>
                            ) : allRecommendationsLoaded ? (
                                <><FontAwesomeIcon icon={faCheckCircle} /> No More Articles</>
                            ) : (
                                <><FontAwesomeIcon icon={faSync} /> Load More</>
                            )}
                        </button>
                    </div>
                </>
            ) : (
                <div className="discover-empty">
                    <h3>No new recommendations for you right now.</h3>
                    <p>Check back later, or start saving and reading articles to get personalized suggestions!</p>
                </div>
            )}
        </div>
    );
};

export default DiscoverPage;