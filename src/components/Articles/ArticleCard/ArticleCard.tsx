import React, { useState, useEffect } from 'react';
import './ArticleCard.scss';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faArchive, faTrash, faEllipsisV, faFolderPlus, faSeedling, faPlus, faExternalLinkAlt, faShieldAlt, faStarHalfStroke, faPodcast } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
import CollectionSelector from '../../Collections/CollectionSelector/CollectionSelector';
import { getGradientForString } from '../../../utils/colorUtils';
import { extractUrlMetadata, getDomainColor } from '../../../utils/urlMetadata';
import type { ArticleCardProps } from '../../../interfaces/props/article-card-props';

const ArticleCard: React.FC<ArticleCardProps> = ({
    article,
    onDelete,
    onArchive,
    onToggleBookmark,
    onAddToLibrary,
    isActionPending = false,
}) => {
    // Destructure both standard and metadata fields
    const {
        id, imageUrl, title, excerpt, isBookmarked, isArchived, isUrlOnly, isPastedText, url,
        // Rich metadata fields
        siteName, siteIcon, ogImage, ogDescription, themeColor
    } = article;
    const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCollectionSelector, setShowCollectionSelector] = useState(false);
    const placeholderGradient = getGradientForString(title ?? id ?? '');
    const currentBookmarkState = isBookmarked;

    // Only celebrate a favorite once its confirmed state arrives from the library.
    useEffect(() => {
        if (!isBookmarked) return;
        setIsBookmarkAnimating(true);
        const timer = setTimeout(() => setIsBookmarkAnimating(false), 600);
        return () => clearTimeout(timer);
    }, [isBookmarked]);

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    const handleBookmarkClick = () => {
        if (!id || isActionPending) return;
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
                initial={{ opacity: 0, y: 20 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: isBookmarkAnimating ? [1, 1.02, 1] : 1,
                    rotateY: isBookmarkAnimating ? [0, 5, 0] : 0
                }}
                transition={{
                    duration: 0.5,
                    ease: [0.23, 1, 0.32, 1]
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

                {isUrlOnly ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="article-card-link url-only-link">
                        <div className="rich-preview-container">
                            {/* Hero Image Area */}
                            <div className="preview-image-section">
                                {(ogImage || imageUrl) ? (
                                    <img src={ogImage || imageUrl} alt={title} className="preview-image" loading="lazy" />
                                ) : (
                                    <div
                                        className="preview-placeholder"
                                        style={{
                                            background: themeColor
                                                ? `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}88 100%)`
                                                : `linear-gradient(135deg, ${getDomainColor(url)} 0%, ${getDomainColor(url + 'gradient')} 100%)`
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faSeedling} className="preview-icon" />
                                    </div>
                                )}
                                <div className="preview-overlay external-link-overlay">
                                    <FontAwesomeIcon icon={faExternalLinkAlt} className="external-link-icon" />
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="preview-content">
                                <h2 className="preview-title">
                                    {title || 'Click to view original article'}
                                </h2>

                                <p className="preview-description">
                                    {ogDescription || excerpt || 'Content extraction is being retried automatically. Click to view the original article.'}
                                </p>

                                <div className="preview-footer">
                                    <div className="preview-source">
                                        <img
                                            src={siteIcon || extractUrlMetadata(url).favicon}
                                            alt=""
                                            className="source-favicon"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                        <span className="source-name">{siteName || extractUrlMetadata(url).siteName}</span>
                                        {extractUrlMetadata(url).isSecure && (
                                            <FontAwesomeIcon icon={faShieldAlt} className="secure-icon" title="Secure connection" />
                                        )}
                                    </div>
                                    <span className="read-original-badge">Read Original</span>
                                </div>
                            </div>
                        </div>
                    </a>
                ) : (
                    <Link viewTransition to={`/article/${id}`} className="article-card-link">
                        <div className="card-image-container">
                            {(ogImage || imageUrl) ? (
                                <img src={ogImage || imageUrl} alt={title} className="card-image" loading="lazy" />
                            ) : (
                                <div
                                    className="card-image-placeholder"
                                    style={{
                                        background: themeColor
                                            ? `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}88 100%)`
                                            : placeholderGradient
                                    }}
                                >
                                    <span className="placeholder-icon">
                                        <FontAwesomeIcon icon={faSeedling} />
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="card-content">
                            <h2 className="card-title">{title}</h2>
                            <p className="card-description">{ogDescription || excerpt}</p>

                            <div className="card-footer">
                                <div className="source-info">
                                    {siteIcon && (
                                        <img
                                            src={siteIcon}
                                            alt=""
                                            className="source-favicon"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <span className="source-name">{siteName || extractUrlMetadata(url).siteName}</span>
                                </div>
                                <div className="status-indicators">
                                    {article.summary && (
                                        <FontAwesomeIcon
                                            icon={faStarHalfStroke}
                                            className="indicator-summary"
                                            title="AI Summary Available"
                                        />
                                    )}
                                    {article.audioLocation && (
                                        <FontAwesomeIcon
                                            icon={faPodcast}
                                            className="indicator-audio"
                                            title="Audio Overview Available"
                                        />
                                    )}
                                </div>
                            </div>
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
                                disabled={isActionPending}
                                aria-pressed={currentBookmarkState}
                                aria-label={currentBookmarkState ? "Remove from favorites" : "Add to favorites"}
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
                                    disabled={isActionPending}
                                    aria-label="Article actions"
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
                                            {!isPastedText && <button
                                                onClick={() => {
                                                    setShowCollectionSelector(true);
                                                    setTimeout(() => setShowDropdown(false), 50);
                                                }}
                                                className="dropdown-item collection-item"
                                            >
                                                <FontAwesomeIcon icon={faFolderPlus} />
                                                <span>Add to Collection</span>
                                            </button>}
                                            <button
                                                onClick={() => handleDropdownAction(() => id && onArchive(id))}
                                                disabled={isActionPending}
                                                className="dropdown-item archive-item"
                                            >
                                                <FontAwesomeIcon icon={faArchive} />
                                                <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDropdownAction(() => id && onDelete(id))}
                                                disabled={isActionPending}
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

            {!isPastedText && <CollectionSelector
                isOpen={showCollectionSelector}
                onClose={() => setShowCollectionSelector(false)}
                articleId={id ?? ''}
            />}
        </>
    );
};

export default ArticleCard;
