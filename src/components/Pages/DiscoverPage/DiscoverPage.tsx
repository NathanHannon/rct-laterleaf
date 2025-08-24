import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ArticleCard from '../../Articles/ArticleCard/ArticleCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { Article } from '../../../interfaces/article';
import './DiscoverPage.scss';
import { useToast } from '../../../context/toastContext';

const DiscoverPage: React.FC = () => {
    const { getToken, isSignedIn } = useAuth();
    const { showSuccess, showError } = useToast();
    const [recommendations, setRecommendations] = useState<Article[]>([]);
    const [recommendationType, setRecommendationType] = useState<'personalized' | 'popular'>('popular');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = useCallback(async () => {
        if (!isSignedIn) return;
        setIsLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const response = await fetch(`/api/recommendations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            const data = await response.json();
            setRecommendations(data.articles);
            setRecommendationType(data.type);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [getToken, isSignedIn]);

    useEffect(() => {
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

    if (error) {
        return <div className="discover-page-error">Could not load recommendations at this time.</div>;
    }

    return (
        <div className="discover-page">
            <div className="discover-header">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            {recommendations.length > 0 ? (
                <div className="discover-grid">
                    {recommendations.map(article => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            onAddToLibrary={handleAddToLibrary}
                            onDelete={() => { }}
                            onArchive={() => { }}
                            onToggleBookmark={() => { }}
                        />
                    ))}
                </div>
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