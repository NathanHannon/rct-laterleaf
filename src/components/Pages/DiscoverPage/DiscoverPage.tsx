import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ArticleCard from '../../Articles/ArticleCard/ArticleCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSync } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../../interfaces/article';
import './DiscoverPage.scss';
import { useToast } from '../../../context/toastContext';
import { motion, type Variants } from 'framer-motion';

const DiscoverPage: React.FC = () => {
    const { getToken, isSignedIn } = useAuth();
    const { showSuccess, showError } = useToast();
    const [recommendations, setRecommendations] = useState<Article[]>([]);
    const [recommendationType, setRecommendationType] = useState<'personalized' | 'popular'>('popular');
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        if (!isSignedIn) return;
        setIsFetchingMore(true); // Use this for both initial load and "load more"
        try {
            const token = await getToken();
            const response = await fetch(`/api/recommendations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            const data = await response.json();

            // On initial load, set recommendations. On "load more", append them.
            setRecommendations(prev => [...prev, ...data.articles]);
            setRecommendationType(data.type);
        } catch {
            showError("Error", "Could not load recommendations.");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [getToken, isSignedIn, showError]);

    useEffect(() => {
        // Initial fetch
        setRecommendations([]); // Clear previous recommendations on mount
        fetchRecommendations();
    }, [fetchRecommendations]);

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

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: 'easeOut',
            },
        },
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
                    <motion.div
                        className="discover-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {recommendations.map(article => (
                            <motion.div key={article.id} variants={itemVariants}>
                                <ArticleCard
                                    article={article}
                                    onAddToLibrary={handleAddToLibrary}
                                    onDelete={() => { }}
                                    onArchive={() => { }}
                                    onToggleBookmark={() => { }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                    <div className="discover-footer">
                        <button onClick={fetchRecommendations} disabled={isFetchingMore} className="load-more-button">
                            {isFetchingMore ? (
                                <><FontAwesomeIcon icon={faSpinner} spin /> Loading...</>
                            ) : (
                                <><FontAwesomeIcon icon={faSync} /> Load More</>
                            )}
                        </button>
                    </div>
                </>
            ) : (
                <div className="discover-empty">
                    <h3>No recommendations for you right now.</h3>
                    <p>Start saving and reading articles to get personalized suggestions!</p>
                </div>
            )}
        </div>
    );
};

export default DiscoverPage;