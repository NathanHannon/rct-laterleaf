import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import './ConfirmationDialog.scss';

interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isPending?: boolean;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isPending = false,
    variant = 'warning'
}) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (isOpen && !dialog?.open) dialog?.showModal();
        if (!isOpen && dialog?.open) dialog.close();
    }, [isOpen]);

    const content = (
        <dialog
            ref={dialogRef}
            className="confirmation-dialog-overlay"
            aria-label={title}
            aria-busy={isPending}
            onCancel={(event) => { event.preventDefault(); if (!isPending) onCancel(); }}
            onClick={(event) => { if (event.target === event.currentTarget && !isPending) onCancel(); }}
        >
        <AnimatePresence>
            {isOpen && (
                    <motion.div
                        className={`confirmation-dialog ${variant}`}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-header">
                            <div className="dialog-icon">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                            </div>
                            <h3>{title}</h3>
                            <button
                                className="close-button"
                                disabled={isPending}
                                onClick={isPending ? undefined : onCancel}
                                aria-label="Close"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="dialog-content">
                            <p>{message}</p>
                        </div>

                        <div className="dialog-actions">
                            <button
                                className="cancel-button"
                                autoFocus
                                disabled={isPending}
                                onClick={isPending ? undefined : onCancel}
                            >
                                {cancelText}
                            </button>
                            <button
                                className={`confirm-button ${variant}`}
                                disabled={isPending}
                                onClick={onConfirm}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
            )}
        </AnimatePresence>
        </dialog>
    );

    return createPortal(content, document.body);
};

export default ConfirmationDialog;
