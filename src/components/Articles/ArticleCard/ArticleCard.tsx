import React from 'react';
import './ArticleCard.scss';

interface ArticleCardProps {
    imageUrl?: string; // Make imageUrl optional
    title: string;
    description: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ imageUrl, title, description }) => {
    return (
        <div className="article-card">
            {imageUrl && <div className="card-image" style={{ backgroundImage: `url(${imageUrl})` }}></div>}
            <div className="card-content">
                <p className="card-title">{title}</p>
                <p className="card-description">{description}</p>
            </div>
        </div>
    );
};

export default ArticleCard; 