import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlus } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'motion/react';
import CollectionCard from '../CollectionCard/CollectionCard';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import CollectionFormModal from '../CollectionFormModal/CollectionFormModal';
import type { Article } from '../../../interfaces/article';
import './CollectionsList.scss';

interface Collection {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    createdAt: string;
    updatedAt: string;
    articleCount?: number;
}

interface CollectionWithArticles extends Collection {
    articles: Article[];
}

const CollectionsList: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [createModalInitialData, setCreateModalInitialData] = useState({ name: '', description: '', emoji: '📦' });
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; collectionId: string | null; collectionName: string }>({
        show: false,
        collectionId: null,
        collectionName: ''
    });

    const { data: collections = [], isLoading: loading } = useQuery({
        queryKey: ['collections'],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch('/api/collections', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch collections');
            const data = await response.json();

            const collectionsWithArticles = await Promise.all(
                data.map(async (collection: Collection) => {
                    try {
                        const articlesResponse = await fetch(`/api/collections/${collection.id}/articles`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const articles = articlesResponse.ok ? await articlesResponse.json() : [];
                        return { ...collection, articleCount: articles.length, articles };
                    } catch {
                        return { ...collection, articleCount: 0, articles: [] };
                    }
                })
            );

            return collectionsWithArticles as CollectionWithArticles[];
        },
        enabled: isLoaded && !!isSignedIn,
    });

    const { data: suggestedCollections = [], isLoading: loadingSuggestions } = useQuery({
        queryKey: ['collection-suggestions'],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch('/api/collections/suggest-new', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            return response.json() as Promise<{ name: string; emoji: string; reason: string }[]>;
        },
        enabled: isLoaded && !!isSignedIn,
    });

    const createMutation = useMutation({
        mutationFn: async (data: Partial<{ name: string; description: string; emoji: string }>) => {
            const token = await getToken();
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create collection');
        },
        onSuccess: () => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['collections'] });
        },
    });

    const editMutation = useMutation({
        mutationFn: async (data: Partial<Collection>) => {
            if (!editingCollection) return;
            const token = await getToken();
            const response = await fetch(`/api/collections/${editingCollection.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: data.name, description: data.description, emoji: data.emoji })
            });
            if (!response.ok) throw new Error('Failed to update collection');
        },
        onSuccess: () => {
            setEditingCollection(null);
            queryClient.invalidateQueries({ queryKey: ['collections'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (collectionId: string) => {
            const token = await getToken();
            const response = await fetch(`/api/collections/${collectionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete collection');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            setDeleteConfirm({ show: false, collectionId: '', collectionName: '' });
        },
        onError: () => {
            setDeleteConfirm({ show: false, collectionId: '', collectionName: '' });
        },
    });

    const handleCreateCollection = (data: Partial<{ name: string; description: string; emoji: string }>) => {
        if (!data.name?.trim()) return;
        createMutation.mutate(data);
    };

    const handleEditCollection = (data: Partial<Collection>) => {
        if (!editingCollection) return;
        editMutation.mutate(data);
    };

    const handleDeleteCollection = (collectionId: string) => {
        const collection = collections.find(c => c.id === collectionId);
        setDeleteConfirm({
            show: true,
            collectionId,
            collectionName: collection?.name || 'this collection'
        });
    };

    const confirmDeleteCollection = () => {
        if (!deleteConfirm.collectionId) return;
        deleteMutation.mutate(deleteConfirm.collectionId);
    };

    const handleUseSuggestion = (suggestion: { name: string; emoji: string; reason: string }) => {
        setCreateModalInitialData({
            name: suggestion.name,
            description: suggestion.reason,
            emoji: suggestion.emoji
        });
        setShowCreateModal(true);
    };

    const openCreateModal = () => {
        setCreateModalInitialData({ name: '', description: '', emoji: '📦' });
        setShowCreateModal(true);
    };

    if (!isLoaded || loading) {
        return (
            <div className="loading-container">
                <FontAwesomeIcon icon={faSpinner} spin size="3x" />
            </div>
        );
    }

    if (!isSignedIn) {
        return <div>Please sign in to view your collections.</div>;
    }

    return (
        <div className="collections-container-premium">
            <motion.header
                className="collections-header-premium"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
                <div className="header-top">
                    <div className="header-left">
                        <h1 className="collections-title">Collections</h1>
                        <span className="collections-count">{collections.length} Curated Archives</span>
                    </div>
                    <div className="header-right">
                        <button
                            onClick={openCreateModal}
                            className="create-collection-btn"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            New Collection
                        </button>
                    </div>
                </div>
                <p className="collections-subtitle">Organize your readings into meaningful thematic spaces.</p>
            </motion.header>

            {(loadingSuggestions || suggestedCollections.length > 0) && (
                <div className="suggestions-section">
                    <h2>Suggested for You</h2>
                    {loadingSuggestions ? (
                        <div className="suggestions-loading">
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Finding suggestions...</span>
                        </div>
                    ) : (
                        <div className="suggestions-grid">
                            {suggestedCollections.map((suggestion, index) => (
                                <motion.div
                                    key={index}
                                    className="suggestion-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleUseSuggestion(suggestion)}
                                >
                                    <div className="suggestion-emoji">{suggestion.emoji}</div>
                                    <div className="suggestion-content">
                                        <h3>{suggestion.name}</h3>
                                        <p>{suggestion.reason}</p>
                                    </div>
                                    <div className="suggestion-action">
                                        <FontAwesomeIcon icon={faPlus} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <motion.div
                className="collections-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.08,
                            delayChildren: 0.1
                        }
                    }
                }}
            >
                {collections.map((collection) => (
                    <motion.div
                        key={collection.id}
                        variants={{
                            hidden: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' },
                            visible: {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                filter: 'blur(0px)',
                                transition: {
                                    duration: 0.6,
                                    ease: [0.23, 1, 0.32, 1]
                                }
                            }
                        }}
                    >
                        <CollectionCard
                            collection={collection}
                            articles={collection.articles}
                            isDropdownOpen={activeDropdown === collection.id}
                            onToggleDropdown={() => setActiveDropdown(
                                activeDropdown === collection.id ? null : collection.id
                            )}
                            onEdit={setEditingCollection}
                            onDelete={handleDeleteCollection}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Create/Edit Modals */}
            <CollectionFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateCollection}
                mode="create"
                initialData={createModalInitialData}
            />

            {editingCollection && (
                <CollectionFormModal
                    isOpen={!!editingCollection}
                    onClose={() => setEditingCollection(null)}
                    onSave={handleEditCollection}
                    mode="edit"
                    initialData={editingCollection}
                />
            )}

            <ConfirmationDialog
                isOpen={deleteConfirm.show}
                onConfirm={confirmDeleteCollection}
                onCancel={() => setDeleteConfirm({ show: false, collectionId: '', collectionName: '' })}
                title="Delete Collection"
                message={`Are you sure you want to delete "${deleteConfirm.collectionName}"? Articles will not be deleted.`}
                variant="danger"
            />
        </div>
    );
};

export default CollectionsList;