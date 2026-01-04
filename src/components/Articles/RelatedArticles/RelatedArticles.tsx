import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid } from '@fortawesome/free-solid-svg-icons';
import './RelatedArticles.scss';

interface RelatedArticle {
    id: string;
    title?: string;
    excerpt?: string;
    imageUrl?: string;
    url?: string;
    similarity: number;
    isBookmarked: boolean;
}

interface RelatedArticlesProps {
    articleId: string;
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ articleId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const token = await getToken();
                const response = await fetch(`/api/articles/${articleId}/related?limit=3`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setRelatedArticles(data);
                }
            } catch (error) {
                console.error('Failed to fetch related articles:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRelated();
    }, [articleId, getToken]);

    // Don't render if no related articles
    if (!isLoading && relatedArticles.length === 0) {
        return null;
    }

    const handleArticleClick = (id: string) => {
        navigate(`/article/${id}`);
    };

    return (
        <div className="related-articles-container">
            <button
                className="related-articles-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isLoading}
            >
                <span className="toggle-icon">📚</span>
                <span className="toggle-text">
                    {isLoading ? 'Loading...' : `Related in Your Library (${relatedArticles.length})`}
                </span>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>

            {!isLoading && (
                <div className={`related-articles-list ${isExpanded ? 'expanded' : ''}`}>
                    {relatedArticles.map((article) => (
                        <div
                            key={article.id}
                            className="related-article-card"
                            onClick={() => handleArticleClick(article.id)}
                        >
                            {article.imageUrl && (
                                <div className="related-article-image">
                                    <img src={article.imageUrl} alt={article.title || 'Article'} />
                                </div>
                            )}
                            <div className="related-article-content">
                                <h4 className="related-article-title">
                                    {article.title || 'Untitled Article'}
                                    {article.isBookmarked && (
                                        <span className="bookmark-badge">
                                            <FontAwesomeIcon icon={faBookmarkSolid} />
                                        </span>
                                    )}
                                </h4>
                                {article.excerpt && (
                                    <p className="related-article-excerpt">
                                        {article.excerpt.substring(0, 100)}...
                                    </p>
                                )}
                                <div className="related-article-meta">
                                    <span className="similarity-badge">
                                        {Math.round(article.similarity * 100)}% similar
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RelatedArticles;
