import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import type { Article } from '../../../interfaces/article';
import './ArticleReader.scss';

const ArticleReader = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const { getToken } = useAuth();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!articleId) return;

            try {
                setLoading(true);
                const token = await getToken();
                const response = await fetch(`/api/articles/${articleId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data: Article = await response.json();
                setArticle(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [articleId, getToken]);

    if (loading) {
        return <div>Loading article...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!article) {
        return <div>Article not found.</div>;
    }

    return (
        <div className="article-reader">
            <h1>{article.title}</h1>
            <div className="article-author">By {article.author || 'Unknown author'}</div>
            {article.publishedAt && <div className="article-date">Published on: {new Date(article.publishedAt).toLocaleDateString()}</div>}
            <hr />
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content || '' }}></div>
        </div>
    );
};

export default ArticleReader; 