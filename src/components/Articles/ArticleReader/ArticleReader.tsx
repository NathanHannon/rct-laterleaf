import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import type { Article } from '../../../interfaces/article';
import './ArticleReader.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid, faArchive, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const ArticleReader = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleFavorite = async () => {
        if (!articleId || !article) return;
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/favorite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to favorite article');
            }
            // Update local state to reflect the change immediately
            setArticle(prev => prev ? { ...prev, isFavorited: !prev.isFavorited } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleArchive = async () => {
        if (!articleId || !article) return;
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/archive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to archive article');
            }
            // Update local state to reflect the change immediately
            setArticle(prev => prev ? { ...prev, isArchived: !prev.isArchived } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleDelete = async () => {
        if (!articleId) return;
        if (window.confirm('Are you sure you want to delete this article?')) {
            try {
                const token = await getToken();
                const response = await fetch(`/api/articles/${articleId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    navigate('/articles');
                } else {
                    throw new Error('Failed to delete article');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            }
        }
    };

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
                // console.log('ArticleReader received data:', {
                //     articleId: data.id,
                //     title: data.title,
                //     isFavorited: data.isFavorited,
                //     isArchived: data.isArchived
                // });
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
            <div className="article-actions">
                <button onClick={handleFavorite} className={`button-favorite ${article.isFavorited ? 'favorited' : ''}`}>
                    <FontAwesomeIcon icon={article.isFavorited ? faStarSolid : faStarRegular} />
                    <span>{article.isFavorited ? 'Unfavorite' : 'Favorite'}</span>
                </button>
                <button onClick={handleArchive} className="button-archive">
                    <FontAwesomeIcon icon={faArchive} />
                    <span>{article.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <button onClick={handleDelete} className="button-delete">
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                </button>
            </div>
            <h1>{article.title}</h1>
            <div className="article-author">By {article.author || 'Unknown author'}</div>
            {article.publishedAt && <div className="article-date">Published on: {new Date(article.publishedAt).toLocaleDateString()}</div>}
            <div className="article-source">
                <p>This content is republished from <a href={article.url} target="_blank" rel="noopener noreferrer">the original source</a> for personal use. All rights belong to the original author and publisher.</p>
            </div>
            <hr />
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content || '' }}></div>
        </div>
    );
};

export default ArticleReader; 