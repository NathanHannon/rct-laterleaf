import { apiUrl } from '../../../constants/api';
import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faClock, faTag } from '@fortawesome/free-solid-svg-icons';
import './RelatedArticles.scss';

interface RelatedArticle {
    id: string;
    title?: string;
    excerpt?: string;
    imageUrl?: string;
    url?: string;
    siteName?: string;
    readingTime?: number;
    similarity: number;
    isBookmarked: boolean;
    isArchived?: boolean;
    status?: string;
    progressPercentage?: number;
    savedAt?: string;
    sharedTagCount?: number;
}

interface RelatedArticlesProps {
    articleId: string;
    variant?: 'compact' | 'end-of-article';
}

function isFinishedArticle(article: RelatedArticle): boolean {
    const status = (article.status || 'unread').toLowerCase();
    return Boolean(article.isArchived) || status === 'read' || status === 'archived' || (article.progressPercentage ?? 0) >= 80;
}

function formatSavedAge(savedAt?: string): string | null {
    if (!savedAt) return null;
    const savedMs = new Date(savedAt).getTime();
    if (!Number.isFinite(savedMs)) return null;

    const days = Math.floor((Date.now() - savedMs) / (1000 * 60 * 60 * 24));
    if (days < 2) return 'Saved recently';
    if (days < 14) return `Saved ${days}d ago`;
    if (days < 60) {
        const weeks = Math.floor(days / 7);
        return `Saved ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) return `Saved ${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.floor(months / 12);
    return `Saved ${years} ${years === 1 ? 'year' : 'years'} ago`;
}

function getStatusBadge(article: RelatedArticle): { label: string; tone: 'unread' | 'progress' | 'read' } {
    if (isFinishedArticle(article)) {
        return { label: 'Read', tone: 'read' };
    }
    const progress = article.progressPercentage ?? 0;
    if (progress > 0) {
        return { label: `Continue · ${progress}% read`, tone: 'progress' };
    }
    const age = formatSavedAge(article.savedAt);
    return {
        label: age ? `Unread · ${age}` : 'Unread',
        tone: 'unread',
    };
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ articleId, variant = 'compact' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const { data: relatedArticles = [], isLoading } = useQuery({
        queryKey: ['related-articles', articleId],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch(apiUrl(`/articles/${articleId}/related?limit=4`), {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch related articles');
            return response.json() as Promise<RelatedArticle[]>;
        },
    });

    if (!isLoading && relatedArticles.length === 0) {
        return null;
    }

    const unreadCount = relatedArticles.filter((a) => !isFinishedArticle(a)).length;

    const handleArticleClick = (id: string) => {
        navigate(`/article/${id}`);
    };

    const isEndVariant = variant === 'end-of-article';
    const showList = isEndVariant ? !isLoading : !isLoading && isExpanded;

    const compactToggleLabel = isLoading
        ? 'Loading...'
        : unreadCount > 0
            ? unreadCount === relatedArticles.length
                ? `${unreadCount} unread related ${unreadCount === 1 ? 'article' : 'articles'} in your library`
                : `Related in Your Library (${relatedArticles.length} · ${unreadCount} unread)`
            : `Related in Your Library (${relatedArticles.length})`;

    const renderCards = () => (
        <div className={`related-articles-list ${showList ? 'expanded' : ''} ${isEndVariant ? 'always-expanded' : ''}`}>
            {relatedArticles.map((article) => {
                const statusBadge = getStatusBadge(article);
                return (
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
                                <span>{article.title || 'Untitled Article'}</span>
                                {article.isBookmarked && (
                                    <span className="bookmark-badge" title="Bookmarked">
                                        <FontAwesomeIcon icon={faBookmarkSolid} />
                                    </span>
                                )}
                            </h4>
                            {article.excerpt && (
                                <p className="related-article-excerpt">
                                    {article.excerpt.substring(0, 120)}
                                    {article.excerpt.length > 120 ? '...' : ''}
                                </p>
                            )}
                            <div className="related-article-meta">
                                <span className={`status-badge status-badge--${statusBadge.tone}`}>
                                    {statusBadge.label}
                                </span>
                                {article.readingTime && article.readingTime > 0 ? (
                                    <span className="meta-pill">
                                        <FontAwesomeIcon icon={faClock} /> {article.readingTime} min
                                    </span>
                                ) : null}
                                {article.sharedTagCount && article.sharedTagCount > 0 ? (
                                    <span className="meta-pill">
                                        <FontAwesomeIcon icon={faTag} /> {article.sharedTagCount}{' '}
                                        {article.sharedTagCount === 1 ? 'shared tag' : 'shared tags'}
                                    </span>
                                ) : null}
                                <span className="similarity-badge">
                                    {Math.round(article.similarity * 100)}% match
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    if (isEndVariant) {
        if (isLoading) return null;
        return (
            <section className="related-articles-container related-articles-container--end" aria-label="Up next from your library">
                <div className="related-articles-end-header">
                    <div className="end-header-title">
                        <span className="toggle-icon">📚</span>
                        <h3>{unreadCount > 0 ? 'Up Next from Your Library' : 'Related in Your Library'}</h3>
                    </div>
                    <p className="end-header-subtitle">
                        {unreadCount > 0
                            ? 'Unread saves connected to what you just read — pick one up while it is top of mind.'
                            : 'Other articles in your library connected to this topic.'}
                    </p>
                </div>
                {renderCards()}
            </section>
        );
    }

    return (
        <div className="related-articles-container">
            <button
                className="related-articles-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isLoading}
            >
                <span className="toggle-icon">📚</span>
                <span className="toggle-text">{compactToggleLabel}</span>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>

            {!isLoading && renderCards()}
        </div>
    );
};

export default RelatedArticles;
