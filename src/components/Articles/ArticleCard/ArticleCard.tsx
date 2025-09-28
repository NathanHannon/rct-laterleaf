import React, { useState, useEffect } from 'react';
import './ArticleCard.scss';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faArchive, faTrash, faEllipsisV, faFolderPlus, faNewspaper, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
import CollectionSelector from '../../Collections/CollectionSelector/CollectionSelector';
import { getGradientForString } from '../../../utils/colorUtils';
import type { ArticleCardProps } from '../../../interfaces/props/article-card-props';

const ArticleCard: React.FC<ArticleCardProps> = ({
    article,
    onDelete,
    onArchive,
    onToggleBookmark,
    onAddToLibrary, // Destructure new prop
}) => {
    // Reverted to `imageUrl` to match the actual data property for the hero image.
    const { id, imageUrl, title, excerpt, isBookmarked, isArchived, isUrlOnly, url } = article;
    const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
    const [showSaveEffect, setShowSaveEffect] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCollectionSelector, setShowCollectionSelector] = useState(false);
    // Optimistic UI state for bookmark
    const [optimisticBookmark, setOptimisticBookmark] = useState<boolean | null>(null);

    // Generate a consistent gradient for placeholders
    const placeholderGradient = getGradientForString(title ?? id ?? '');

    // Use optimistic state if available, otherwise fall back to prop
    const currentBookmarkState = optimisticBookmark !== null ? optimisticBookmark : isBookmarked;

    console.log(`ArticleCard ${id}: isBookmarked=${isBookmarked}, optimistic=${optimisticBookmark}, current=${currentBookmarkState}`);

    // Reset optimistic state when the actual prop changes (backend response received)
    useEffect(() => {
        if (optimisticBookmark !== null && optimisticBookmark === isBookmarked) {
            setOptimisticBookmark(null);
        }
    }, [isBookmarked, optimisticBookmark]);

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    const handleBookmarkClick = () => {
        if (!id) return;

        // Optimistic UI update
        const newBookmarkState = !currentBookmarkState;
        setOptimisticBookmark(newBookmarkState);

        setIsBookmarkAnimating(true);
        if (newBookmarkState) {
            setShowSaveEffect(true);
            setTimeout(() => setShowSaveEffect(false), 1200);
        }

        setTimeout(() => setIsBookmarkAnimating(false), 600);
        onToggleBookmark(id);
    };

    const handleDropdownAction = (action: () => void) => {
        action();
        setShowDropdown(false);
    };

    // Close dropdown when collection modal opens to prevent flickering
    useEffect(() => {
        if (showCollectionSelector) {
            setShowDropdown(false);
        }
    }, [showCollectionSelector]);

    return (
        <>
            <motion.div
                className={`article-card-wrapper ${isArchived ? 'archived' : ''}`}
                animate={isBookmarkAnimating ? {
                    scale: [1, 1.02, 1],
                    rotateY: [0, 2, 0]
                } : {}}
                transition={{
                    duration: 0.6,
                    ease: "easeInOut"
                }}
            >
                <AnimatePresence>
                    {currentBookmarkState && (
                        <motion.div
                            className="favorite-indicator"
                            initial={{ y: -30, opacity: 0, rotateX: -90 }}
                            animate={{
                                y: 0,
                                opacity: 1,
                                rotateX: 0,
                                scale: [1, 1.1, 1],
                            }}
                            exit={{ y: -30, opacity: 0, rotateX: -90 }}
                            transition={{
                                scale: {
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 4,
                                    ease: "easeInOut"
                                },
                                y: { duration: 0.4, ease: "easeOut" },
                                opacity: { duration: 0.4 },
                                rotateX: { duration: 0.4, ease: "easeOut" }
                            }}
                        >
                            <FontAwesomeIcon icon={faBookmarkSolid} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save to Library Effect */}
                <AnimatePresence>
                    {showSaveEffect && (
                        <motion.div
                            className="save-effect"
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <span>📚 Saved to Library</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isUrlOnly ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="article-card-link url-only-link">
                        <div className="card-image-container">
                            <div className="card-image-placeholder url-only-placeholder" style={{ background: placeholderGradient }}>
                                <span className="placeholder-icon">
                                    <FontAwesomeIcon icon={faNewspaper} />
                                </span>
                                <span className="url-only-badge">Original Link</span>
                            </div>
                        </div>
                        <div className="card-content">
                            <p className="card-title">{title || 'Original Article'}</p>
                            <p className="card-description">
                                {excerpt || 'Click to view the original article. Content extraction is being retried automatically.'}
                            </p>
                            <p className="card-url">{url}</p>
                        </div>
                    </a>
                ) : (
                    <Link to={`/article/${id}`} className="article-card-link">
                        <div className="card-image-container">
                            {imageUrl ? (
                                <img src={imageUrl} alt={title} className="card-image" loading="lazy" />
                            ) : (
                                <div className="card-image-placeholder" style={{ background: placeholderGradient }}>
                                    <span className="placeholder-icon">
                                        <FontAwesomeIcon icon={faNewspaper} />
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="card-content">
                            <p className="card-title">{title}</p>
                            <p className="card-description">{excerpt}</p>
                        </div>
                    </Link>
                )}

                {/* Updated Actions with Dropdown */}
                <div className="article-card-actions" onClick={handleActionClick}>
                    {onAddToLibrary ? (
                        <button
                            onClick={() => onAddToLibrary(id!)}
                            className="button-add-to-library"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Add to Library</span>
                        </button>
                    ) : (
                        <>
                            <motion.button
                                onClick={handleBookmarkClick}
                                className={`button-favorite ${currentBookmarkState ? 'favorited' : ''}`}
                                whileTap={{ scale: 0.95 }}
                                animate={isBookmarkAnimating ? {
                                    scale: [1, 1.1, 1],
                                    rotateZ: [0, 5, -5, 0]
                                } : {}}
                                transition={{ duration: 0.3 }}
                            >
                                <FontAwesomeIcon icon={currentBookmarkState ? faBookmarkSolid : faBookmarkRegular} />
                            </motion.button>

                            <div className="actions-dropdown">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="dropdown-toggle"
                                >
                                    <FontAwesomeIcon icon={faEllipsisV} />
                                </button>

                                <AnimatePresence>
                                    {showDropdown && (
                                        <motion.div
                                            className="dropdown-menu"
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <button
                                                onClick={() => {
                                                    setShowCollectionSelector(true);
                                                    // Small delay to ensure modal opens before dropdown closes
                                                    setTimeout(() => setShowDropdown(false), 50);
                                                }}
                                                className="dropdown-item collection-item"
                                            >
                                                <FontAwesomeIcon icon={faFolderPlus} />
                                                <span>Add to Collection</span>
                                            </button>
                                            <button
                                                onClick={() => handleDropdownAction(() => id && onArchive(id))}
                                                className="dropdown-item archive-item"
                                            >
                                                <FontAwesomeIcon icon={faArchive} />
                                                <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDropdownAction(() => id && onDelete(id))}
                                                className="dropdown-item delete-item"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                                <span>Delete</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>

            <CollectionSelector
                isOpen={showCollectionSelector}
                onClose={() => setShowCollectionSelector(false)}
                articleId={id ?? ''}
            />
        </>
    );
};

export default ArticleCard;