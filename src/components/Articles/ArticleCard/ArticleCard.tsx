import React from 'react';
import './ArticleCard.scss';
import { Link } from 'react-router-dom';
import type { Article } from '../../../interfaces/article';

interface ArticleCardProps {
    article: Article;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onToggleFavorite: (id: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete, onArchive, onToggleFavorite }) => {
    const { id, imageUrl, title, excerpt } = article;

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <div className="article-card-wrapper">
            <Link to={`/article/${id}`} className="article-card-link">
                {imageUrl && <div className="card-image" style={{ backgroundImage: `url(${imageUrl})` }}></div>}
                <div className="card-content">
                    <p className="card-title">{title}</p>
                    <p className="card-description">{excerpt}</p>
                </div>
            </Link>
            <div className="article-card-actions" onClick={handleActionClick}>
                <button onClick={() => id && onToggleFavorite(id)} className="button-favorite">Favorite</button>
                <button onClick={() => id && onArchive(id)} className="button-archive">Archive</button>
                <button onClick={() => id && onDelete(id)} className="button-delete">Delete</button>
            </div>
        </div>
    );
};

export default ArticleCard; 