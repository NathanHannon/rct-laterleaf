import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";
import ArticleCard from '../ArticleCard/ArticleCard';
import './ArticleList.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';


const ArticleList: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [newLink, setNewLink] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const fetchArticles = async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/articles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response was not ok: ${errorText}`);
            }

            const data: Article[] = await response.json();
            setArticles(data);
        } catch (error) {
            console.error("Failed to fetch articles:", error);
        }
    };

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchArticles();
        }
    }, [isLoaded, isSignedIn]);


    const handleImportArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLink || isImporting) return;

        setIsImporting(true);
        try {
            const token = await getToken();
            const response = await fetch('/api/articles/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: newLink })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to import article: ${errorText}`);
            }

            setNewLink('');
            fetchArticles();
        } catch (error) {
            console.error("Failed to import article:", error);
        } finally {
            setIsImporting(false);
        }
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    if (!isSignedIn) {
        return <div>Please sign in to see your articles.</div>;
    }

    return (
        <div className="article-list-container">
            <form className="input-container" onSubmit={handleImportArticle}>
                <div className="input-bar">
                    <input
                        type="text"
                        placeholder="Paste link here"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        disabled={isImporting}
                    />
                    <button type="submit" className="save-button" disabled={isImporting}>
                        {isImporting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                            <FontAwesomeIcon icon={faPlus} />
                        )}
                        <span>{isImporting ? 'Saving...' : 'Save'}</span>
                    </button>
                </div>
            </form>
            <h2 className="list-title">My List</h2>
            <div className="article-grid">
                {articles.filter(article => article.id).map(article => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                    />
                ))}
            </div>
        </div>
    );
};

export default ArticleList; 