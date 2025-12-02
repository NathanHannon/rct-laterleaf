import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
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
    const [collections, setCollections] = useState<Collection[]>([]);
    const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [addingToCollection, setAddingToCollection] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCollections();
            fetchSuggestions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const token = await getToken();
            const response = await fetch('/api/collections/suggest-for-article', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ articleId })
            });

            if (response.ok) {
                const data = await response.json();
                setSuggestedNames(data);
            }
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            // Fetch all collections
            const collectionsResponse = await fetch('/api/collections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Fetch collections this article is already in
            const articleCollectionsResponse = await fetch(`/api/articles/${articleId}/collections`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (collectionsResponse.ok) {
                const allCollections = await collectionsResponse.json();
                let articleCollectionIds: string[] = [];

                if (articleCollectionsResponse.ok) {
                    const articleCollections = await articleCollectionsResponse.json();
                    articleCollectionIds = articleCollections.map((c: any) => c.id);
                }

                // Mark collections that already have this article
                const collectionsWithStatus = allCollections.map((c: Collection) => ({
                    ...c,
                    hasArticle: articleCollectionIds.includes(c.id)
                }));

                setCollections(collectionsWithStatus);
            }
        } catch (error) {
            showError('Failed to fetch collections', 'Please try again later.');
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCollection = async (collectionId: string) => {
        const selectedCollection = collections.find(c => c.id === collectionId);
        if (selectedCollection?.hasArticle) {
            return; // Already in collection
        }

        setAddingToCollection(collectionId);
        const collectionName = selectedCollection?.name || 'collection';

        try {
            const token = await getToken();
            const response = await fetch(`/api/collections/${collectionId}/link-article`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ articleId })
            });

            if (response.ok) {
                showSuccess('Article added to collection', `Successfully added to "${collectionName}"`);
                onSuccess?.();
                onClose();
            } else if (response.status === 409) {
                // Article already in collection
                showWarning('Article already in collection', `This article is already in "${collectionName}"`);
            } else {
                throw new Error('Failed to add to collection');
            }
        } catch (error) {
            showError('Failed to add to collection', 'Please try again later.');
            console.error('Failed to add article to collection:', error);
        } finally {
            setAddingToCollection(null);
        }
    };

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
