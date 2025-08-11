import React, { useState } from 'react';
import './ArticleCard.scss';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faArchive, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-solid-svg-icons';

interface ArticleCardProps {
    article: Article;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onToggleFavorite: (id: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete, onArchive, onToggleFavorite }) => {
    const { id, imageUrl, title, excerpt, isBookmarked, isArchived } = article;
    const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
    const [showSaveEffect, setShowSaveEffect] = useState(false);
    console.log(`ArticleCard ${id}: isBookmarked=${isBookmarked}`);

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    const handleBookmarkClick = () => {
        if (!id) return;

        setIsBookmarkAnimating(true);
        if (!isBookmarked) {
            setShowSaveEffect(true);
            setTimeout(() => setShowSaveEffect(false), 1200);
        }

        setTimeout(() => setIsBookmarkAnimating(false), 600);
        onToggleFavorite(id);
    };

    return (
        <motion.div
            className={`article-card-wrapper ${isArchived ? 'archived' : ''}`}
            animate={isBookmarkAnimating ? {
                scale: [1, 1.02, 1],
                rotateY: [0, 2, 0]
            } : {}}
            transition={{ duration: 0.6, ease: "easeInOut" }}
        >
            <AnimatePresence>
                {isBookmarked && (
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
            <Link to={`/article/${id}`} className="article-card-link">
                {imageUrl && (
                    <div
                        className="card-image"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                )}
                <div className="card-content">
                    <p className="card-title">{title}</p>
                    <p className="card-description">{excerpt}</p>
                </div>
            </Link>
            <div className="article-card-actions" onClick={handleActionClick}>
                <motion.button
                    onClick={handleBookmarkClick}
                    className={`button-favorite ${isBookmarked ? 'favorited' : ''}`}
                    whileTap={{ scale: 0.95 }}
                    animate={isBookmarkAnimating ? {
                        scale: [1, 1.1, 1],
                        rotateZ: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.3 }}
                >
                    <FontAwesomeIcon icon={isBookmarked ? faBookmarkSolid : faBookmarkRegular} />
                    <span>{isBookmarked ? 'Remove' : 'Bookmark'}</span>
                </motion.button>
                <button onClick={() => id && onArchive(id)} className="button-archive">
                    <FontAwesomeIcon icon={faArchive} />
                    <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <button onClick={() => id && onDelete(id)} className="button-delete">
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                </button>
            </div>
        </motion.div>
    );
};

export default ArticleCard; 