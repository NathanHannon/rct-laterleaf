import React, { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useAuth } from "@clerk/react";
import { useNanoTags } from '../../hooks/useNanoTags';
import './TagsManager.scss';

interface Tag {
    id: string;
    name: string;
}

interface TagsManagerProps {
    userArticleId: string;
    articleTitle?: string;
    articleContent?: string;
}

const TagsManager: React.FC<TagsManagerProps> = ({ userArticleId, articleTitle, articleContent }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    const { isAvailable: isNanoAvailable, generateTags } = useNanoTags();

    const fetchAllTags = useCallback(async () => {
        if (!userArticleId) return;
        setIsLoading(true);
        try {
            const token = await getToken();
            const fetchActions = [
                fetch(`/api/user-articles/${userArticleId}/tags`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })
            ];

            // Trigger server-side tagging refresh or just fetch existing suggestedTags/similar ones
            // The backend /tags/suggest/{userArticleId} now returns a blend of AI and similar tags.
            if (navigator.onLine) {
                fetchActions.push(
                    fetch(`/api/tags/suggest/${userArticleId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                );
            }

            const responses = await Promise.all(fetchActions);
            const tagsResponse = responses[0];
            const suggestedResponse = responses[1];

            if (!tagsResponse.ok) throw new Error('Failed to fetch tags.');
            const tagsData: Tag[] = await tagsResponse.json();
            setTags(tagsData);

            let serverSuggestedData: Tag[] = [];
            if (suggestedResponse && suggestedResponse.ok) {
                serverSuggestedData = await suggestedResponse.json();
            }

            // Exclude tags that are already assigned
            const existingNames = tagsData.map(t => t.name.toLowerCase());
            const filteredSuggestions = serverSuggestedData.filter(
                s => !existingNames.includes(s.name.toLowerCase())
            );

            // Fallback to offline Nano AI if server returned nothing or we are offline
            if (!navigator.onLine && isNanoAvailable && articleTitle && articleContent && filteredSuggestions.length === 0) {
                const nanoSuggested = await generateTags(articleTitle, articleContent, 3);
                setSuggestedTags(nanoSuggested.map(t => ({ id: `nano-${t}`, name: t })));
            } else {
                setSuggestedTags(filteredSuggestions);
            }

            setError(null);
        } catch (err) {
            // ... error handling
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [userArticleId, getToken, isNanoAvailable, articleTitle, articleContent, generateTags]);

    useEffect(() => {
        fetchAllTags();
    }, [fetchAllTags]);

    const addTag = async (tagName: string) => {
        if (!tagName.trim()) return;

        if (!navigator.onLine) {
            setError('Cannot add tags while offline. Please connect to the internet.');
            return;
        }

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

            // Immediately update the local state to show the tag is added
            // This prevents the user from clicking the suggestion twice
            const normalizedTag = tagName.trim();
            setTags(prev => [...prev, { id: 'temp-' + Date.now(), name: normalizedTag }]);
            setSuggestedTags(prev => prev.filter(t => t.name.toLowerCase() !== normalizedTag.toLowerCase()));

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
        if (!navigator.onLine) {
            setError('Cannot remove tags while offline. Please connect to the internet.');
            return;
        }

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