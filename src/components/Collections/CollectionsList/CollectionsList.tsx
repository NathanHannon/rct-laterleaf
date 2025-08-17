import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlus } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedCollectionCard from '../AnimatedCollectionCard/AnimatedCollectionCard';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import type { Article } from '../../../interfaces/article';
import './CollectionsList.scss';

interface Collection {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    articleCount?: number;
}

interface CollectionWithArticles extends Collection {
    articles: Article[];
}

const CollectionsList: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [collections, setCollections] = useState<CollectionWithArticles[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [newCollection, setNewCollection] = useState({ name: '', description: '' });
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; collectionId: string | null; collectionName: string }>({
        show: false,
        collectionId: null,
        collectionName: ''
    });

    const fetchCollections = async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/collections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch collections');
            }

            const data = await response.json();

            // Fetch articles for each collection
            const collectionsWithArticles = await Promise.all(
                data.map(async (collection: Collection) => {
                    try {
                        const articlesResponse = await fetch(`/api/collections/${collection.id}/articles`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const articles = articlesResponse.ok ? await articlesResponse.json() : [];
                        return {
                            ...collection,
                            articleCount: articles.length,
                            articles: articles
                        };
                    } catch (error) {
                        console.error(`Failed to fetch articles for collection ${collection.id}:`, error);
                        return {
                            ...collection,
                            articleCount: 0,
                            articles: []
                        };
                    }
                })
            );

            setCollections(collectionsWithArticles);
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchCollections();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn]);

    const handleCreateCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollection.name.trim()) return;

        try {
            const token = await getToken();
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCollection)
            });

            if (!response.ok) {
                throw new Error('Failed to create collection');
            }

            setNewCollection({ name: '', description: '' });
            setShowCreateModal(false);
            fetchCollections();
        } catch (error) {
            console.error('Failed to create collection:', error);
        }
    };

    const handleEditCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCollection) return;

        try {
            const token = await getToken();
            const response = await fetch(`/api/collections/${editingCollection.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editingCollection.name,
                    description: editingCollection.description
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update collection');
            }

            setEditingCollection(null);
            fetchCollections();
        } catch (error) {
            console.error('Failed to update collection:', error);
        }
    };

    const handleDeleteCollection = async (collectionId: string) => {
        const collection = collections.find(c => c.id === collectionId);
        setDeleteConfirm({
            show: true,
            collectionId,
            collectionName: collection?.name || 'this collection'
        });
    };

    const confirmDeleteCollection = async () => {
        if (!deleteConfirm.collectionId) return;

        try {
            const token = await getToken();
            const response = await fetch(`/api/collections/${deleteConfirm.collectionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete collection');
            }

            fetchCollections();
            setDeleteConfirm({ show: false, collectionId: '', collectionName: '' });
        } catch (error) {
            console.error('Failed to delete collection:', error);
            setDeleteConfirm({ show: false, collectionId: '', collectionName: '' });
        }
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
        <div className="collections-container">
            <div className="collections-header">
                <h1>My Collections</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="create-collection-btn"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    New Collection
                </button>
            </div>

            <motion.div
                className="collections-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {collections.map((collection) => (
                    <motion.div
                        key={collection.id}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                        }}
                        transition={{ duration: 0.5 }}
                    >
                        <AnimatedCollectionCard
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

            {/* Create Collection Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>Create New Collection</h2>
                            <form onSubmit={handleCreateCollection}>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={newCollection.name}
                                        onChange={(e) => setNewCollection(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))}
                                        placeholder="Collection name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description (optional)</label>
                                    <textarea
                                        value={newCollection.description}
                                        onChange={(e) => setNewCollection(prev => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        placeholder="Collection description"
                                        rows={3}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit">Create Collection</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Collection Modal */}
            <AnimatePresence>
                {editingCollection && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditingCollection(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>Edit Collection</h2>
                            <form onSubmit={handleEditCollection}>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={editingCollection.name}
                                        onChange={(e) => setEditingCollection(prev => prev ? ({
                                            ...prev,
                                            name: e.target.value
                                        }) : null)}
                                        placeholder="Collection name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description (optional)</label>
                                    <textarea
                                        value={editingCollection.description || ''}
                                        onChange={(e) => setEditingCollection(prev => prev ? ({
                                            ...prev,
                                            description: e.target.value
                                        }) : null)}
                                        placeholder="Collection description"
                                        rows={3}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setEditingCollection(null)}>
                                        Cancel
                                    </button>
                                    <button type="submit">Save Changes</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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