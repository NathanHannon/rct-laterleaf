import React from 'react';
import './ArticleCard.scss';
import { Link } from 'react-router-dom';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid, faArchive, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

interface ArticleCardProps {
    article: Article;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onToggleFavorite: (id: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete, onArchive, onToggleFavorite }) => {
    const { id, imageUrl, title, excerpt, isFavorited, isArchived } = article;
    console.log(`ArticleCard ${id}: isFavorited=${isFavorited}`);

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <div className={`article-card-wrapper ${isArchived ? 'archived' : ''}`}>
            {isFavorited && <div className="favorite-indicator"><FontAwesomeIcon icon={faStarSolid} /></div>}
            <Link to={`/article/${id}`} className="article-card-link">
                {imageUrl && <div className="card-image" style={{ backgroundImage: `url(${imageUrl})` }}></div>}
                <div className="card-content">
                    <p className="card-title">{title}</p>
                    <p className="card-description">{excerpt}</p>
                </div>
            </Link>
            <div className="article-card-actions" onClick={handleActionClick}>
                <button onClick={() => id && onToggleFavorite(id)} className={`button-favorite ${isFavorited ? 'favorited' : ''}`}>
                    <FontAwesomeIcon icon={isFavorited ? faStarSolid : faStarRegular} />
                    <span>{isFavorited ? 'Unfavorite' : 'Favorite'}</span>
                </button>
                <button onClick={() => id && onArchive(id)} className="button-archive">
                    <FontAwesomeIcon icon={faArchive} />
                    <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <button onClick={() => id && onDelete(id)} className="button-delete">
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                </button>
            </div>
        </div>
    );
};

export default ArticleCard; 