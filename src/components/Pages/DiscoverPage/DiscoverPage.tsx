import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import RecommendationCard from '../../Articles/RecommendationCard/RecommendationCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSync, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../../interfaces/article';
import './DiscoverPage.scss';
import { useToast } from '../../../context/toastContext';
import { motion, type Variants, AnimatePresence } from 'framer-motion';

const DiscoverPage: React.FC = () => {
    const { getToken, isSignedIn } = useAuth();
    const { showSuccess, showError } = useToast();
    const [recommendations, setRecommendations] = useState<Article[]>([]);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once

    const handleAddToLibrary = async (articleId: string) => {
        const article = recommendations.find(rec => rec.id === articleId);
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
        } catch {
            showError("Error", "Could not add article to your library.");
        }
    };

    // We can simplify the variants. The container no longer needs to control staggering.
    const itemVariants: Variants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
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
            <div className="discover-header">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            {recommendations.length > 0 ? (
                <>
                    <div className="discover-grid">
                        {/* 2. Wrap the list with AnimatePresence */}
                        <AnimatePresence>
                            {recommendations.filter(article => article && article.id).map((article, index) => (
                                // 3. Apply animation props directly to the motion.div
                                <motion.div
                                    key={article.id}
                                    variants={itemVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: (index % 12) * 0.07, ease: 'easeOut' }}
                                >
                                    <RecommendationCard
                                        article={article}
                                        onAddToLibrary={handleAddToLibrary}
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