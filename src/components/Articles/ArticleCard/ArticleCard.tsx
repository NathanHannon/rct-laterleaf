import React from 'react';
import './ArticleCard.scss';
import { Link } from 'react-router-dom';

interface ArticleCardProps {
    id: string;
    imageUrl?: string; // Make imageUrl optional
    title: string;
    description: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ id, imageUrl, title, description }) => {
    return (
        <Link to={`/article/${id}`} className="article-card">
            {imageUrl && <div className="card-image" style={{ backgroundImage: `url(${imageUrl})` }}></div>}
            <div className="card-content">
                <p className="card-title">{title}</p>
                <p className="card-description">{description}</p>
            </div>
        </Link>
    );
};

export default ArticleCard; 