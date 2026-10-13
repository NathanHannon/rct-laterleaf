import { forwardRef } from 'react';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faExternalLinkAlt, faNewspaper, faRss, faBan, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { getGradientForString } from '../../../utils/colorUtils';
import './RecommendationCard.scss';

interface RecommendationCardProps {
    article: Article;
    onAddToLibrary: (articleId: string) => void;
    onDismiss?: (articleId: string) => void;
    showSource?: boolean;
}

const RecommendationCard = forwardRef<HTMLDivElement, RecommendationCardProps>(
    ({ article, onAddToLibrary, onDismiss, showSource = false }, ref) => {
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

        const sourceName = article.feedTitle || article.siteName || (article.url ? new URL(article.url).hostname.replace(/^www\./, '') : null);
        const sourceIcon = article.feedTitle ? faRss : faGlobe;

        return (
            <div className="recommendation-card" ref={ref}>
                <div className="card-image" style={cardImageStyle}>
                    {/* 2. Conditionally render the icon */}
                    {!article.imageUrl && (
                        <FontAwesomeIcon icon={faNewspaper} className="placeholder-icon" />
                    )}
                </div>
                <div className="card-content">
                    {showSource && sourceName && (
                        <div className="card-feed-title">
                            <FontAwesomeIcon icon={sourceIcon} className="feed-icon" />
                            {sourceName}
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
                        {onDismiss && (
                            <button
                                onClick={() => article.id && onDismiss(article.id)}
                                className="action-button dismiss-button"
                                title="Not interested"
                            >
                                <FontAwesomeIcon icon={faBan} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

export default RecommendationCard;
