import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import './CollectionFormModal.scss';

interface CollectionFormData {
    name: string;
    description: string;
    emoji?: string;
}

interface CollectionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<CollectionFormData>) => void;
    initialData?: Partial<CollectionFormData>;
    mode: 'create' | 'edit';
}

const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData = { name: '', description: '', emoji: '' },
    mode
}) => {
    const [data, setData] = useState(initialData);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        // This ensures that when you open the modal to edit a *different*
        // collection, the form's state is updated with the new collection's data.
        setData(initialData);
    }, [initialData]);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setData(prev => ({ ...prev, emoji: emojiData.emoji }));
        setShowPicker(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="modal-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2>{mode === 'create' ? 'Create New Collection' : 'Edit Collection'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group-horizontal">
                            <div className="emoji-picker-container">
                                <label>Icon</label>
                                <button type="button" className="emoji-selector" onClick={() => setShowPicker(p => !p)}>
                                    {data.emoji ? <span>{data.emoji}</span> : <span className="emoji-placeholder"></span>}
                                </button>
                                {showPicker && (
                                    <div className="emoji-picker-popover">
                                        <EmojiPicker onEmojiClick={onEmojiClick} />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="My Reading List"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description (optional)</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="A collection of interesting articles"
                                rows={3}
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose}>Cancel</button>
                            <button type="submit">{mode === 'create' ? 'Create Collection' : 'Save Changes'}</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CollectionFormModal;