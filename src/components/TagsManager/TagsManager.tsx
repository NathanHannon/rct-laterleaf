import React, { useState, type FormEvent } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    const [newTagName, setNewTagName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    const { isAvailable: isNanoAvailable, generateTags } = useNanoTags();

    const { data: tags = [], isLoading } = useQuery({
        queryKey: ['tags', userArticleId],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch(`/api/user-articles/${userArticleId}/tags`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch tags.');
            return response.json() as Promise<Tag[]>;
        },
        enabled: !!userArticleId,
    });

    const { data: suggestedTags = [] } = useQuery({
        queryKey: ['tag-suggestions', userArticleId],
        queryFn: async () => {
            if (!navigator.onLine) {
                if (isNanoAvailable && articleTitle && articleContent) {
                    const nanoSuggested = await generateTags(articleTitle, articleContent, 3);
                    return nanoSuggested.map(t => ({ id: `nano-${t}`, name: t }));
                }
                return [];
            }
            const token = await getToken();
            const response = await fetch(`/api/tags/suggest/${userArticleId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) return [];
            return response.json() as Promise<Tag[]>;
        },
        enabled: !!userArticleId,
        select: (serverSuggested) => {
            const existingNames = tags.map(t => t.name.toLowerCase());
            return serverSuggested.filter(s => !existingNames.includes(s.name.toLowerCase()));
        },
    });

    const addTagMutation = useMutation({
        mutationFn: async (tagName: string) => {
            if (!navigator.onLine) throw new Error('Cannot add tags while offline. Please connect to the internet.');
            const token = await getToken();
            const response = await fetch(`/api/tags/add-to-article`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: tagName.trim(), userArticleId }),
            });
            if (!response.ok) throw new Error('Failed to add tag.');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags', userArticleId] });
            queryClient.invalidateQueries({ queryKey: ['tag-suggestions', userArticleId] });
            setError(null);
        },
        onError: (err: Error) => setError(err.message),
    });

    const removeTagMutation = useMutation({
        mutationFn: async (tagId: string) => {
            if (!navigator.onLine) throw new Error('Cannot remove tags while offline. Please connect to the internet.');
            const token = await getToken();
            const where = JSON.stringify({ id: tagId });
            const response = await fetch(`/api/user-articles/${userArticleId}/tags?where=${encodeURIComponent(where)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to remove tag.');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags', userArticleId] });
            queryClient.invalidateQueries({ queryKey: ['tag-suggestions', userArticleId] });
            setError(null);
        },
        onError: (err: Error) => setError(err.message),
    });

    const handleAddTagFromInput = async (e: FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        addTagMutation.mutate(newTagName);
        setNewTagName('');
    };

    const handleAddSuggestedTag = (tagName: string) => {
        addTagMutation.mutate(tagName);
    };

    const handleRemoveTag = (tagId: string) => {
        removeTagMutation.mutate(tagId);
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