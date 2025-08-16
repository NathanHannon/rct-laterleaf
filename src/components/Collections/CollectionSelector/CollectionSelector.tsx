import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import './CollectionSelector.scss';

interface Collection {
    id: string;
    name: string;
    description?: string;
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
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingToCollection, setAddingToCollection] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCollections();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const response = await fetch('/api/collections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCollections(data);
            }
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCollection = async (collectionId: string) => {
        setAddingToCollection(collectionId);
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
                onSuccess?.();
                onClose();
            } else if (response.status === 409) {
                // Article already in collection
                console.log('Article already in this collection');
            } else {
                throw new Error('Failed to add to collection');
            }
        } catch (error) {
            console.error('Failed to add article to collection:', error);
        } finally {
            setAddingToCollection(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="collection-selector-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="collection-selector-modal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h3>Add to Collection</h3>
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
                                {collections.map((collection) => (
                                    <motion.button
                                        key={collection.id}
                                        className="collection-option"
                                        onClick={() => handleAddToCollection(collection.id)}
                                        disabled={addingToCollection === collection.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="collection-info">
                                            <h4>{collection.name}</h4>
                                            {collection.description && (
                                                <p>{collection.description}</p>
                                            )}
                                        </div>
                                        <div className="collection-action">
                                            {addingToCollection === collection.id ? (
                                                <FontAwesomeIcon icon={faSpinner} spin />
                                            ) : (
                                                <FontAwesomeIcon icon={faPlus} />
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
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
