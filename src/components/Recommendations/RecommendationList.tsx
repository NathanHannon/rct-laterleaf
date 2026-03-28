import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from "@clerk/react";
import ArticleCard from '../Articles/ArticleCard/ArticleCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../interfaces/article';
import './RecommendationList.scss';

const RecommendationList: React.FC = () => {
    const { getToken, isSignedIn } = useAuth();
    const [recommendations, setRecommendations] = useState<Article[]>([]);
    const [recommendationType, setRecommendationType] = useState<'personalized' | 'popular'>('popular');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const fetchRecommendations = useCallback(async () => {
        if (!isSignedIn) return;

        setIsLoading(true);
        setError(null);

        try {
            const token = await getToken();
            const response = await fetch(`/api/recommendations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            }

            const data = await response.json();
            setRecommendations(data.articles);
            setRecommendationType(data.type);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [getToken, isSignedIn]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const handleAddToLibrary = async (articleId: string) => {
        try {
            const token = await getToken();
            // This endpoint should create the user_article relation
            const response = await fetch(`/api/articles/${articleId}/save`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to add article to library');
            }

            // On success, remove the article from the carousel
            setRecommendations(prev => prev.filter(article => article.id !== articleId));

        } catch (err) {
            console.error('Error adding article to library:', err);
        }
    };

    const handleScroll = (direction: 'left' | 'right') => {
        if (trackRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
            const scrollAmount = clientWidth * 0.8; // Scroll by 80% of the visible width

            if (direction === 'right') {
                // If we are at the end (or very close to it), loop to the beginning
                if (scrollLeft + clientWidth >= scrollWidth - 1) {
                    trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            } else { // direction === 'left'
                // If we are at the beginning, loop to the end
                if (scrollLeft === 0) {
                    trackRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
                } else {
                    trackRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                }
            }
        }
    };

    const title = recommendationType === 'popular' ? 'Popular Articles' : 'Recommended for You';

    if (isLoading) {
        return (
            <div className="recommendation-list-loading">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Finding articles for you...</span>
            </div>
        );
    }

    if (error) {
        return <div className="recommendation-list-error">Could not load recommendations at this time.</div>;
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="recommendation-list">
            <div className="list-header">
                <h2>{title}</h2>
                <div className="carousel-controls">
                    <button onClick={() => handleScroll('left')} aria-label="Scroll left"><FontAwesomeIcon icon={faChevronLeft} /></button>
                    <button onClick={() => handleScroll('right')} aria-label="Scroll right"><FontAwesomeIcon icon={faChevronRight} /></button>
                </div>
            </div>
            <div className="carousel-track" ref={trackRef}>
                {recommendations.map(article => (
                    <div className="carousel-item" key={article.id}>
                        <ArticleCard
                            article={article}
                            onAddToLibrary={handleAddToLibrary}
                            onDelete={() => { }}
                            onArchive={() => { }}
                            onToggleBookmark={() => { }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationList;