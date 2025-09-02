import React, { useState, useEffect, type FormEvent, useCallback } from 'react';
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
    const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    const fetchAllTags = useCallback(async () => {
        if (!userArticleId) return;
        setIsLoading(true);
        try {
            const token = await getToken();
            // Fetch existing and suggested tags in parallel
            const [tagsResponse, suggestedTagsResponse] = await Promise.all([
                fetch(`/api/user-articles/${userArticleId}/tags`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`/api/tags/suggest/${userArticleId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
            ]);

            if (!tagsResponse.ok) throw new Error('Failed to fetch tags.');
            if (!suggestedTagsResponse.ok) throw new Error('Failed to fetch suggestions.');

            const tagsData: Tag[] = await tagsResponse.json();
            const suggestedTagsData: Tag[] = await suggestedTagsResponse.json();

            setTags(tagsData);
            setSuggestedTags(suggestedTagsData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [userArticleId, getToken]);

    useEffect(() => {
        fetchAllTags();
    }, [fetchAllTags]);

    const addTag = async (tagName: string) => {
        if (!tagName.trim()) return;

        try {
            const token = await getToken();
            const response = await fetch(`/api/tags/add-to-article`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: tagName.trim(),
                    userArticleId: userArticleId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add tag.');
            }

            await fetchAllTags();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };

    const handleAddTagFromInput = async (e: FormEvent) => {
        e.preventDefault();
        await addTag(newTagName);
        setNewTagName('');
    };

    const handleAddSuggestedTag = async (tagName: string) => {
        await addTag(tagName);
    };

    const handleRemoveTag = async (tagId: string) => {
        try {
            const token = await getToken();
            const where = JSON.stringify({ id: tagId });
            const response = await fetch(`/api/user-articles/${userArticleId}/tags?where=${encodeURIComponent(where)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to remove tag.');
            }

            await fetchAllTags();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };

    return (
        <div className="tags-manager" data-version="1.0.1">
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
            <form onSubmit={handleAddTagFromInput} className="tags-manager__form">
                <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Add a tag"
                    className="tags-manager__input"
                />
                <button type="submit" className="tags-manager__add-btn">Add</button>
            </form>

            {suggestedTags.length > 0 && (
                <div className="tags-manager__suggestions">
                    <h5 className="suggestions__title">Suggestions</h5>
                    <div className="suggestions__list">
                        {suggestedTags.map(tag => (
                            <button
                                key={tag.id}
                                className="suggestion-item"
                                onClick={() => handleAddSuggestedTag(tag.name)}
                            >
                                + {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagsManager;