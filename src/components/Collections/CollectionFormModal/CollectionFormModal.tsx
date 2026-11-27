import React, { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { useTheme } from '../../../hooks/useTheme';
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

const QUICK_EMOJIS = [
    '📚', '💡', '🧠', '💻', '🔬', '🎨',
    '✍️', '📈', '🌍', '🍳', '🎧', '🌱',
    '⚡', '🧭', '🎬', '🏛️', '🛠️', '✨',
];

const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
    isOpen, onClose, onSave, initialData, mode,
}) => {
    const [data, setData] = useState({ name: '', description: '', emoji: '' });
    const [showPicker, setShowPicker] = useState(false);
    const [showFullPicker, setShowFullPicker] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const id = useId();
    const { activeAppearance } = useTheme();
    const name = initialData?.name ?? '';
    const description = initialData?.description ?? '';
    const emoji = initialData?.emoji ?? '';

    useEffect(() => {
        if (isOpen) {
            setData({ name, description, emoji });
            setShowPicker(false);
            setShowFullPicker(false);
        }
    }, [isOpen, name, description, emoji]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if ('closedBy' in dialog) {
            (dialog as HTMLDialogElement & { closedBy: string }).closedBy = 'any';
        }
        if (isOpen && !dialog.open) {
            dialog.showModal();
            nameRef.current?.focus();
        }
        if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    const selectEmoji = (selected: string) => {
        setData((previous) => ({ ...previous, emoji: selected }));
        setShowPicker(false);
        setShowFullPicker(false);
    };

    const onEmojiClick = (selection: EmojiClickData) => {
        selectEmoji(selection.emoji);
    };

    const handleClearEmoji = () => {
        setData((previous) => ({ ...previous, emoji: '' }));
        setShowPicker(false);
        setShowFullPicker(false);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedName = data.name.trim();
        if (trimmedName) {
            onSave({
                ...data,
                name: trimmedName,
                description: data.description.trim(),
            });
        }
    };

    return createPortal(
        <dialog
            ref={dialogRef}
            className="collection-form-dialog"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-intro`}
            onCancel={(event) => {
                event.preventDefault();
                if (showPicker) {
                    setShowPicker(false);
                    setShowFullPicker(false);
                } else {
                    onClose();
                }
            }}
            onClose={() => { if (isOpen) onClose(); }}
            onClick={(event) => {
                if ('closedBy' in HTMLDialogElement.prototype || event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (
                    event.clientX < bounds.left ||
                    event.clientX > bounds.right ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom
                ) {
                    onClose();
                }
            }}
        >
            {isOpen && (
                <>
                    <header className="collection-form-heading">
                        <p className="collection-form-eyebrow">A thread of thought</p>
                        <button
                            className="collection-form-close"
                            type="button"
                            aria-label="Close collection form"
                            onClick={onClose}
                        >
                            ×
                        </button>
                        <h2 id={`${id}-title`}>
                            {mode === 'create' ? 'New collection' : 'Edit collection'}
                        </h2>
                        <p id={`${id}-intro`}>Give related reads a place to belong.</p>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <div className="collection-form-name-row">
                            <div className="collection-form-field collection-form-icon">
                                <label htmlFor={`${id}-emoji`}>Icon</label>
                                <button
                                    id={`${id}-emoji`}
                                    type="button"
                                    className={`collection-form-emoji ${showPicker ? 'is-open' : ''} ${!data.emoji ? 'is-empty' : ''}`}
                                    aria-label="Choose collection icon"
                                    aria-expanded={showPicker}
                                    aria-controls={`${id}-picker`}
                                    onClick={() => {
                                        setShowPicker((value) => {
                                            if (value) setShowFullPicker(false);
                                            return !value;
                                        });
                                    }}
                                >
                                    {data.emoji || '❧'}
                                </button>
                            </div>
                            <div className="collection-form-field">
                                <label htmlFor={`${id}-name`}>Name</label>
                                <input
                                    id={`${id}-name`}
                                    ref={nameRef}
                                    className="collection-form-input"
                                    value={data.name}
                                    onChange={(event) => setData((previous) => ({ ...previous, name: event.target.value }))}
                                    placeholder="Ideas worth keeping"
                                    required
                                />
                            </div>
                        </div>

                        {showPicker && (
                            <div id={`${id}-picker`} className="collection-form-picker" role="region" aria-label="Icon picker">
                                <div className="collection-form-picker-header">
                                    <span className="picker-label">Quick icons</span>
                                    <div className="picker-header-actions">
                                        {data.emoji && (
                                            <button
                                                type="button"
                                                className="picker-text-btn"
                                                onClick={handleClearEmoji}
                                            >
                                                Clear
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="picker-text-btn"
                                            onClick={() => setShowFullPicker((value) => !value)}
                                        >
                                            {showFullPicker ? 'Hide all' : 'More emojis…'}
                                        </button>
                                    </div>
                                </div>

                                <div className="collection-form-quick-grid">
                                    {QUICK_EMOJIS.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            className={`quick-emoji-btn ${data.emoji === item ? 'is-selected' : ''}`}
                                            aria-label={`Select ${item}`}
                                            aria-pressed={data.emoji === item}
                                            onClick={() => selectEmoji(item)}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>

                                {showFullPicker && (
                                    <div className="collection-form-full-picker">
                                        <EmojiPicker
                                            onEmojiClick={onEmojiClick}
                                            theme={activeAppearance === 'dark' ? Theme.DARK : Theme.LIGHT}
                                            width="100%"
                                            height={300}
                                            lazyLoadEmojis
                                            skinTonesDisabled
                                            autoFocusSearch={false}
                                            searchPlaceholder="Search emojis..."
                                            previewConfig={{ showPreview: false }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="collection-form-field">
                            <label htmlFor={`${id}-description`}>
                                Description <span>(optional)</span>
                            </label>
                            <textarea
                                id={`${id}-description`}
                                className="collection-form-textarea"
                                value={data.description}
                                onChange={(event) => setData((previous) => ({ ...previous, description: event.target.value }))}
                                placeholder="What brings these reads together?"
                                rows={3}
                            />
                        </div>

                        <div className="collection-form-actions">
                            <button type="button" className="collection-form-btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="collection-form-btn collection-form-btn--primary"
                                disabled={!data.name.trim()}
                            >
                                {mode === 'create' ? 'Create collection' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </dialog>,
        document.body,
    );
};

export default CollectionFormModal;
