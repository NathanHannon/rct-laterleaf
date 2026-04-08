import React from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import { useToastContext } from '../../../context/toastContextUtils';
import './CollectionSelector.scss';

interface Collection {
    id: string;
    name: string;
    description?: string;
    hasArticle?: boolean;
}

interface CollectionSelectorProps {
    articleId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
    articleId,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { getToken } = useAuth();
    const { showSuccess, showError, showWarning } = useToastContext();

    const { data: suggestedNames = [], isLoading: loadingSuggestions } = useQuery({
        queryKey: ['collection-suggestions-for-article', articleId],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch('/api/collections/suggest-for-article', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ articleId })
            });
            if (!response.ok) return [];
            return response.json() as Promise<string[]>;
        },
        enabled: isOpen,
    });

    const { data: collections = [], isLoading: loading } = useQuery({
        queryKey: ['collections-for-article', articleId],
        queryFn: async () => {
            const token = await getToken();
            const [collectionsResponse, articleCollectionsResponse] = await Promise.all([
                fetch('/api/collections', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`/api/articles/${articleId}/collections`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!collectionsResponse.ok) throw new Error('Failed to fetch collections');

            const allCollections = await collectionsResponse.json();
            let articleCollectionIds: string[] = [];

            if (articleCollectionsResponse.ok) {
                const articleCollections = await articleCollectionsResponse.json();
                articleCollectionIds = articleCollections.map((c: any) => c.id);
            }

            return allCollections.map((c: Collection) => ({
                ...c,
                hasArticle: articleCollectionIds.includes(c.id)
            })) as Collection[];
        },
        enabled: isOpen,
    });

    const addToCollectionMutation = useMutation({
        mutationFn: async (collectionId: string) => {
            const token = await getToken();
            const response = await fetch(`/api/collections/${collectionId}/link-article`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ articleId })
            });
            return { ok: response.ok, status: response.status, collectionId };
        },
        onSuccess: (result) => {
            const collectionName = collections.find(c => c.id === result.collectionId)?.name || 'collection';
            if (result.ok) {
                showSuccess('Article added to collection', `Successfully added to "${collectionName}"`);
                onSuccess?.();
                onClose();
            } else if (result.status === 409) {
                showWarning('Article already in collection', `This article is already in "${collectionName}"`);
            }
        },
        onError: () => {
            showError('Failed to add to collection', 'Please try again later.');
        },
    });

    const handleAddToCollection = (collectionId: string) => {
        const selectedCollection = collections.find(c => c.id === collectionId);
        if (selectedCollection?.hasArticle) return;
        addToCollectionMutation.mutate(collectionId);
    };

    const addingToCollection = addToCollectionMutation.isPending ? addToCollectionMutation.variables : null;

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="collection-selector-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
            >
                <motion.div
                    className="collection-selector-modal"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{
                        duration: 0.25,
                        ease: [0.4, 0.0, 0.2, 1] // Custom easing for smoother animation
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h3>Add to Collection</h3>
                        {loadingSuggestions && (
                            <span className="suggestions-loading-badge">
                                <FontAwesomeIcon icon={faSpinner} spin size="sm" />
                                Finding suggestions...
                            </span>
                        )}
                    </div>

                    <div className="modal-content">
                        {loading ? (
                            <div className="loading-state">
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <span>Loading collections...</span>
                            </div>
                        ) : collections.length === 0 ? (
                            <div className="empty-state">
                                <p>No collections found.</p>
                                <p>Create a collection first to organize your articles.</p>
                            </div>
                        ) : (
                            <div className="collections-list">
                                {collections
                                    .sort((a, b) => {
                                        const aSuggested = suggestedNames.includes(a.name);
                                        const bSuggested = suggestedNames.includes(b.name);
                                        if (aSuggested && !bSuggested) return -1;
                                        if (!aSuggested && bSuggested) return 1;
                                        return a.name.localeCompare(b.name);
                                    })
                                    .map((collection) => {
                                        const isSuggested = suggestedNames.includes(collection.name);
                                        return (
                                            <motion.button
                                                key={collection.id}
                                                className={`collection-option ${isSuggested ? 'suggested' : ''} ${collection.hasArticle ? 'has-article' : ''}`}
                                                onClick={() => handleAddToCollection(collection.id)}
                                                disabled={addingToCollection === collection.id || collection.hasArticle}
                                                whileHover={collection.hasArticle ? {} : { scale: 1.02 }}
                                                whileTap={collection.hasArticle ? {} : { scale: 0.98 }}
                                            >
                                                <div className="collection-info">
                                                    <div className="collection-name-row">
                                                        <h4>{collection.name}</h4>
                                                        {isSuggested && (
                                                            <span className="suggestion-badge">
                                                                Suggested
                                                            </span>
                                                        )}
                                                    </div>
                                                    {collection.description && (
                                                        <p>{collection.description}</p>
                                                    )}
                                                </div>
                                                <div className="collection-action">
                                                    {addingToCollection === collection.id ? (
                                                        <FontAwesomeIcon icon={faSpinner} spin />
                                                    ) : collection.hasArticle ? (
                                                        <FontAwesomeIcon icon={faCheck} className="check-icon" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    )}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <div className="modal-actions">
                            <button onClick={onClose} className="cancel-button">
                                Cancel
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CollectionSelector;
