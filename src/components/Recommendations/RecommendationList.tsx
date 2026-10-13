import { apiUrl } from '../../constants/api';
import React, { useRef } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ArticleCard from '../Articles/ArticleCard/ArticleCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../interfaces/article';
import './RecommendationList.scss';

const RecommendationList: React.FC = () => {
    const { getToken, isSignedIn } = useAuth();
    const queryClient = useQueryClient();
    const trackRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['recommendations'],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch(apiUrl(`/recommendations`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            return response.json() as Promise<{ articles: Article[]; type: 'personalized' | 'popular' }>;
        },
        enabled: !!isSignedIn,
    });

    const recommendations = data?.articles ?? [];
    const recommendationType = data?.type ?? 'popular';

    const addToLibraryMutation = useMutation({
        mutationFn: async (articleId: string) => {
            const token = await getToken();
            const response = await fetch(apiUrl(`/articles/${articleId}/save`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to add article to library');
            return articleId;
        },
        onSuccess: (articleId) => {
            queryClient.setQueryData(['recommendations'], (old: typeof data | undefined) =>
                old ? { ...old, articles: old.articles.filter(a => a.id !== articleId) } : old
            );
        },
    });

    const handleAddToLibrary = (articleId: string) => {
        addToLibraryMutation.mutate(articleId);
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

    if (isError) {
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