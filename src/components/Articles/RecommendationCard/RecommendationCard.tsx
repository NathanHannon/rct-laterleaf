import { forwardRef } from 'react';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faExternalLinkAlt, faNewspaper, faRss } from '@fortawesome/free-solid-svg-icons';
import { getGradientForString } from '../../../utils/colorUtils';
import './RecommendationCard.scss';

interface RecommendationCardProps {
    article: Article;
    onAddToLibrary: (articleId: string) => void;
}

const RecommendationCard = forwardRef<HTMLDivElement, RecommendationCardProps>(
    ({ article, onAddToLibrary }, ref) => {
        const handleViewOriginal = () => {
            if (article.url) {
                window.open(article.url, '_blank', 'noopener,noreferrer');
            }
        };

        const cardImageStyle = {
            backgroundImage: article.imageUrl
                ? `url(${article.imageUrl})`
                : getGradientForString(article.title ?? ''),
        };

        return (
            <div className="recommendation-card" ref={ref}>
                <div className="card-image" style={cardImageStyle}>
                    {/* 2. Conditionally render the icon */}
                    {!article.imageUrl && (
                        <FontAwesomeIcon icon={faNewspaper} className="placeholder-icon" />
                    )}
                </div>
                <div className="card-content">
                    {article.feedTitle && (
                        <div className="card-feed-title">
                            <FontAwesomeIcon icon={faRss} className="feed-icon" />
                            {article.feedTitle}
                        </div>
                    )}
                    <h3 className="card-title">{article.title}</h3>
                    {article.author && <p className="card-author">{article.author}</p>}
                    <div className="card-actions">
                        <button onClick={() => article.id && onAddToLibrary(article.id)} className="action-button add-button">
                            <FontAwesomeIcon icon={faPlus} /> Add to Library
                        </button>
                        <button onClick={handleViewOriginal} className="action-button view-button">
                            <FontAwesomeIcon icon={faExternalLinkAlt} /> View Original
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);

export default RecommendationCard;
