import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './TagsManager.scss';

interface Tag {
    id: string;
    name: string;
}

interface TagsManagerProps {
    userArticleId: string;
}

const TagsManager: React.FC<TagsManagerProps> = ({ userArticleId }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    const fetchTags = async () => {
        if (!userArticleId) return;
        setIsLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(`/api/user-articles/${userArticleId}/tags`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tags.');
            }

            const data: Tag[] = await response.json();
            setTags(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, [userArticleId]);

    const handleAddTag = async (e: FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        try {
            const token = await getToken();
            const response = await fetch(`/api/tags/add-to-article`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newTagName.trim(),
                    userArticleId: userArticleId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add tag.');
            }

            setNewTagName('');
            await fetchTags(); // Re-fetch to get the updated list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        try {
            const token = await getToken();
            // The backend expects a 'where' clause to identify which tag link to remove.
            const where = JSON.stringify({ id: tagId });
            const response = await fetch(`/api/user-articles/${userArticleId}/tags?where=${encodeURIComponent(where)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to remove tag.');
            }

            await fetchTags(); // Re-fetch to update the list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        }
    };

    return (
        <div className="tags-manager">
            <h4 className="tags-manager__title">Tags</h4>
            {error && <p className="tags-manager__error">{error}</p>}
            <div className="tags-manager__list">
                {isLoading ? (
                    <p>Loading tags...</p>
                ) : (
                    tags.map(tag => (
                        <span key={tag.id} className="tag-item">
                            {tag.name}
                            <button onClick={() => handleRemoveTag(tag.id)} className="tag-item__remove-btn">
                                &times;
                            </button>
                        </span>
                    ))
                )}
                {!isLoading && tags.length === 0 && <p className="tags-manager__no-tags">No tags yet.</p>}
            </div>
            <form onSubmit={handleAddTag} className="tags-manager__form">
                <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Add a tag"
                    className="tags-manager__input"
                />
                <button type="submit" className="tags-manager__add-btn">Add</button>
            </form>
        </div>
    );
};

export default TagsManager;