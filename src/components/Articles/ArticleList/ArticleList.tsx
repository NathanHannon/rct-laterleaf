import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";
import ArticleCard from '../ArticleCard/ArticleCard';
import './ArticleList.scss';

export interface Article {
    id?: string;
    url: string;
    title?: string;
    content?: string;
    excerpt?: string;
    author?: string;
    summary?: string;
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

const ArticleList: React.FC = () => {
    const { getToken } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const token = await getToken();
                const response = await fetch('/api/articles', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data: Article[] = await response.json();
                setArticles(data);
            } catch (error) {
                console.error("Failed to fetch articles:", error);
            }
        };

        fetchArticles();
    }, [getToken]);

    return (
        <div className="article-list-container">
            <div className="input-container">
                <div className="input-bar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path
                            d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                        ></path>
                    </svg>
                    <input type="text" placeholder="Paste link here" />
                </div>
            </div>
            <h2 className="list-title">My List</h2>
            <div className="article-grid">
                {articles.map((article, index) => (
                    <ArticleCard
                        key={article.id || index}
                        // imageUrl={article.imageUrl} // This field does not exist on the model
                        title={article.title || 'Untitled'}
                        description={article.excerpt || 'No excerpt available.'}
                    />
                ))}
            </div>
        </div>
    );
};

export default ArticleList; 