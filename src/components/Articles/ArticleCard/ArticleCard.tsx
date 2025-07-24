import React from 'react';
import './ArticleCard.scss';
import { Link } from 'react-router-dom';
import type { Article } from '../../../interfaces/article';

interface ArticleCardProps {
    article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
    const { id, imageUrl, title, excerpt } = article;
    return (
        <Link to={`/article/${id}`} className="article-card">
            {imageUrl && <div className="card-image" style={{ backgroundImage: `url(${imageUrl})` }}></div>}
            <div className="card-content">
                <p className="card-title">{title}</p>
                <p className="card-description">{excerpt}</p>
            </div>
        </Link>
    );
};

export default ArticleCard; 