import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useCollectionAnimation } from '../../../hooks/useCollectionAnimation';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import type { Article } from '../../../interfaces/article';
import './CollectionCard.scss';

interface Collection {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    createdAt: string;
    updatedAt: string;
    articleCount?: number;
}

interface CollectionCardProps {
    collection: Collection;
    articles: Article[];
    isDropdownOpen: boolean;
    onToggleDropdown: () => void;
    onEdit: (collection: Collection) => void;
    onDelete: (collectionId: string) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
    collection,
    isDropdownOpen,
    onToggleDropdown,
    onEdit,
    onDelete
}) => {
    const navigate = useNavigate();
    const { triggerExplode } = useCollectionAnimation();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleCardClick = () => {
        // Simple fade transition
        triggerExplode();

        // Navigate with a short delay
        setTimeout(() => {
            navigate(`/collections/${collection.id}`);
        }, 100);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents the card's onClick from firing
        setShowDeleteConfirmation(true);
        onToggleDropdown(); // Close the dropdown
    };

    const handleConfirmDelete = () => {
        onDelete(collection.id);
        setShowDeleteConfirmation(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    };

    const handleDropdownClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when clicking dropdown
    };

    return (
        <>
            <motion.div
                className="animated-collection-card"
                layoutId={`collection-${collection.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 }
                }}
                onClick={handleCardClick}
                style={{ cursor: 'pointer' }}
            >
                <div className="collection-header">
                    <div className="collection-info">
                        <div className="collection-title-container">
                            {collection.emoji && <span className="collection-emoji">{collection.emoji}</span>}
                            <motion.h3
                                className="card-title"
                                layoutId={`collection-title-${collection.id}`}
                            >
                                {collection.name}
                            </motion.h3>
                        </div>
                        {collection.description && (
                            <motion.p
                                className="collection-description"
                                layoutId={`collection-description-${collection.id}`}
                            >
                                {collection.description}
                            </motion.p>
                        )}
                        <motion.span
                            className="article-count"
                            layoutId={`collection-count-${collection.id}`}
                        >
                            {collection.articleCount || 0} articles
                        </motion.span>
                    </div>
                    <div className="collection-actions" onClick={handleDropdownClick}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleDropdown();
                            }}
                            className="dropdown-trigger"
                        >
                            <FontAwesomeIcon icon={faEllipsisV} />
                        </button>
                        {isDropdownOpen && (
                            <motion.div
                                className="dropdown-menu"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                ref={dropdownRef}
                            >
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(collection);
                                    onToggleDropdown();
                                }}>
                                    <FontAwesomeIcon icon={faEdit} />
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(e);
                                    }}
                                    className="delete-action"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                    Delete
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            <ConfirmationDialog
                isOpen={showDeleteConfirmation}
                title="Delete Collection"
                message={`Are you sure you want to delete "${collection.name}"? This action cannot be undone. The articles in this collection will not be deleted.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                variant="danger"
            />
        </>
    );
};

export default CollectionCard;
