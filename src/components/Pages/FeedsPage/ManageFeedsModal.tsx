import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash, faRss, faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { RssFeed } from './FeedsPage';
import './ManageFeedsModal.scss';

interface ManageFeedsModalProps {
    isOpen: boolean;
    onClose: () => void;
    feeds: RssFeed[];
    onAddFeed: (url: string) => Promise<void>;
    onRemoveFeed: (feedId: string) => Promise<void>;
}

const ManageFeedsModal: React.FC<ManageFeedsModalProps> = ({
    isOpen,
    onClose,
    feeds,
    onAddFeed,
    onRemoveFeed,
}) => {
    const [feedUrl, setFeedUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = feedUrl.trim();
        if (!trimmed) return;

        setIsAdding(true);
        try {
            await onAddFeed(trimmed);
            setFeedUrl('');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (feedId: string) => {
        setRemovingId(feedId);
        try {
            await onRemoveFeed(feedId);
        } finally {
            setRemovingId(null);
        }
    };

    const content = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="manage-feeds-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="manage-feeds-modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="modal-header__title">
                                <FontAwesomeIcon icon={faRss} className="header-icon" />
                                <h3>Manage Feeds</h3>
                            </div>
                            <button className="close-button" onClick={onClose} aria-label="Close">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <form className="add-feed-form" onSubmit={handleSubmit}>
                            <input
                                type="url"
                                placeholder="Paste an RSS feed URL..."
                                value={feedUrl}
                                onChange={(e) => setFeedUrl(e.target.value)}
                                disabled={isAdding}
                                autoFocus
                            />
                            <button type="submit" disabled={isAdding || !feedUrl.trim()}>
                                {isAdding ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                    'Add'
                                )}
                            </button>
                        </form>

                        <div className="feeds-list">
                            {feeds.length === 0 ? (
                                <div className="feeds-list__empty">
                                    <p>No feeds yet. Paste a URL above to get started.</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {feeds.map((feed) => (
                                        <motion.div
                                            key={feed.id}
                                            className="feed-item"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                                            layout
                                        >
                                            <div className="feed-item__info">
                                                <span className="feed-name">
                                                    {feed.name && feed.name !== 'Unknown Feed' && feed.name !== feed.url
                                                        ? feed.name
                                                        : new URL(feed.url).hostname.replace(/^www\./, '')}
                                                </span>
                                                <span className="feed-url">{feed.url}</span>
                                            </div>
                                            <button
                                                className="feed-item__remove"
                                                onClick={() => handleRemove(feed.id)}
                                                disabled={removingId === feed.id}
                                                aria-label={`Remove ${feed.name}`}
                                            >
                                                {removingId === feed.id ? (
                                                    <FontAwesomeIcon icon={faSpinner} spin />
                                                ) : (
                                                    <FontAwesomeIcon icon={faTrash} />
                                                )}
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};

export default ManageFeedsModal;
