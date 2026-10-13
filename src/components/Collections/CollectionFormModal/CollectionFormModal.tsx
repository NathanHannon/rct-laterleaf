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

const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
    isOpen, onClose, onSave, initialData, mode,
}) => {
    const [data, setData] = useState({ name: '', description: '', emoji: '' });
    const [showPicker, setShowPicker] = useState(false);
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
        }
    }, [isOpen, name, description, emoji]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (isOpen && !dialog?.open) {
            dialog?.showModal();
            nameRef.current?.focus();
        }
        if (!isOpen && dialog?.open) dialog.close();
    }, [isOpen]);

    const onEmojiClick = (selection: EmojiClickData) => {
        setData(previous => ({ ...previous, emoji: selection.emoji }));
        setShowPicker(false);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (data.name.trim()) onSave({ ...data, name: data.name.trim() });
    };

    return createPortal(
        <dialog
            ref={dialogRef}
            className="collection-form-dialog"
            closedby="any"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-intro`}
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onClose={() => { if (isOpen) onClose(); }}
            onClick={(event) => {
                if ('closedBy' in HTMLDialogElement.prototype || event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
            }}
        >
            {isOpen && <>
                <header className="collection-form-heading">
                    <p className="collection-form-eyebrow">A thread of thought</p>
                    <button className="collection-form-close" type="button" aria-label="Close collection form" onClick={onClose}>×</button>
                    <h2 id={`${id}-title`}>{mode === 'create' ? 'A new collection.' : 'Edit your collection.'}</h2>
                    <p id={`${id}-intro`}>Give related reads a place to belong.</p>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="collection-form-name-row">
                        <div className="collection-form-field collection-form-icon">
                            <label htmlFor={`${id}-emoji`}>Icon</label>
                            <button
                                id={`${id}-emoji`}
                                type="button"
                                className="collection-form-emoji"
                                aria-label="Choose collection icon"
                                aria-expanded={showPicker}
                                aria-controls={`${id}-picker`}
                                onClick={() => setShowPicker(value => !value)}
                            >{data.emoji || '❧'}</button>
                        </div>
                        <div className="collection-form-field">
                            <label htmlFor={`${id}-name`}>Name</label>
                            <input
                                id={`${id}-name`}
                                ref={nameRef}
                                value={data.name}
                                onChange={event => setData(previous => ({ ...previous, name: event.target.value }))}
                                placeholder="Ideas worth keeping"
                                required
                            />
                        </div>
                    </div>
                    {showPicker && <div id={`${id}-picker`} className="collection-form-picker">
                        <EmojiPicker onEmojiClick={onEmojiClick} theme={activeAppearance === 'dark' ? Theme.DARK : Theme.LIGHT} width="100%" height={320} />
                    </div>}
                    <div className="collection-form-field">
                        <label htmlFor={`${id}-description`}>Description <span>(optional)</span></label>
                        <textarea
                            id={`${id}-description`}
                            value={data.description}
                            onChange={event => setData(previous => ({ ...previous, description: event.target.value }))}
                            placeholder="What brings these reads together?"
                            rows={3}
                        />
                    </div>
                    <div className="collection-form-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={!data.name.trim()}>{mode === 'create' ? 'Create collection' : 'Save changes'}</button>
                    </div>
                </form>
            </>}
        </dialog>,
        document.body,
    );
};

export default CollectionFormModal;
