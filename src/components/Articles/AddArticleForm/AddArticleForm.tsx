import { apiUrl } from '../../../constants/api';
import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';
import { useToastContext } from '../../../context/toastContextUtils';
import { useApiErrorHandler } from '../../../hooks/useApiErrorHandler';
import { TIP_STORAGE_KEYS, hasSeenTip, markTipSeen, notificationTips } from '../../../constants/notificationTips';
import './AddArticleForm.scss';

interface AddArticleFormProps {
    onArticleAdded: () => void;
}

const AddArticleForm: React.FC<AddArticleFormProps> = ({ onArticleAdded }) => {
    const { getToken } = useAuth();
    const { showSuccess, showWarning, showInfo } = useToastContext();
    const { handleApiError, handleGenericError } = useApiErrorHandler();
    const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
    const [newLink, setNewLink] = useState('');
    const [pastedText, setPastedText] = useState('');

    const importMutation = useMutation({
        mutationFn: async (value: string) => {
            const token = await getToken();
            const isPastedText = inputMode === 'text';
            const response = await fetch(apiUrl(isPastedText ? '/articles/paste' : '/articles/import'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(isPastedText ? { content: value } : { url: value })
            });

            if (!response.ok) {
                await handleApiError(response, 'Save Failed');
                return null;
            }

            return response.json();
        },
        onSuccess: (data) => {
            if (data === null) return; // Error was already handled
            setNewLink('');
            setPastedText('');
            onArticleAdded();

            if (data.isPastedText) {
                showSuccess('Text saved!', 'Your text is ready to read and summarize.');
                return;
            }

            if (data.success === false) {
                showWarning(
                    'Saved Link Only',
                    `${notificationTips.extensionImport.message} We couldn\'t extract the content, so this article was saved as a link.`
                );
            } else {
                showSuccess('Article Saved!', 'The article has been successfully added to your list.');

                if (!hasSeenTip(TIP_STORAGE_KEYS.extensionImport)) {
                    showInfo(
                        notificationTips.extensionImport.title,
                        notificationTips.extensionImport.message,
                        8000,
                    );
                    markTipSeen(TIP_STORAGE_KEYS.extensionImport);
                }
            }
        },
        onError: (err) => {
            handleGenericError(err, 'Import Failed');
        },
    });

    const isImporting = importMutation.isPending;
    const pastedTextBytes = new TextEncoder().encode(pastedText).length;

    const handleImportArticle = (e: React.FormEvent) => {
        e.preventDefault();
        const value = inputMode === 'url' ? newLink.trim() : pastedText.trim();
        if (!value || isImporting) return;
        importMutation.mutate(value);
    };

    return (
        <div className="add-article-wrapper">
            <div className="add-article-mode" role="group" aria-label="What would you like to save?">
                <button type="button" className={inputMode === 'url' ? 'active' : ''} aria-pressed={inputMode === 'url'} onClick={() => setInputMode('url')}>Link</button>
                <button type="button" className={inputMode === 'text' ? 'active' : ''} aria-pressed={inputMode === 'text'} onClick={() => setInputMode('text')}>Copied text</button>
            </div>
            <label className="save-article-label" htmlFor={inputMode === 'url' ? 'save-article-url' : 'save-article-text'}>
                {inputMode === 'url' ? 'Save an article link' : 'Save copied text'}
            </label>
            <form className="add-article-form" onSubmit={handleImportArticle}>
                {inputMode === 'url' ? (
                    <div className="input-wrapper">
                        <input
                            id="save-article-url"
                            type="url"
                            required
                            autoComplete="url"
                            aria-describedby="save-article-help"
                            placeholder="Paste an article link…"
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            disabled={isImporting}
                        />
                        <button type="submit" className="save-link-button" disabled={!newLink.trim() || isImporting}>
                            {isImporting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
                            <span>{isImporting ? 'Saving…' : 'Save'}</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <textarea
                            id="save-article-text"
                            className="pasted-text-input"
                            required
                            maxLength={64_000}
                            rows={5}
                            placeholder="Paste copied text here…"
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            disabled={isImporting}
                        />
                        <div className="pasted-text-footer">
                            <span>{pastedTextBytes.toLocaleString()} / 65,536 bytes</span>
                            <button type="submit" className="save-link-button" disabled={!pastedText.trim() || pastedTextBytes > 65_536 || isImporting}>
                                {isImporting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
                                <span>{isImporting ? 'Saving…' : 'Save text'}</span>
                            </button>
                        </div>
                    </>
                )}
            </form>
            {inputMode === 'url' && <div className="extension-promo" id="save-article-help">
                <FontAwesomeIcon icon={faPuzzlePiece} />
                <span>
                    You can also save as you browse with the <strong>LaterLeaf browser extension.</strong>
                </span>
            </div>}
        </div>
    );
};

export default AddArticleForm;