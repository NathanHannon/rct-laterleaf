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
    const [newLink, setNewLink] = useState('');

    const importMutation = useMutation({
        mutationFn: async (url: string) => {
            const token = await getToken();
            const response = await fetch('/api/articles/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url })
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
            onArticleAdded();

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

    const handleImportArticle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLink.trim() || isImporting) return;
        importMutation.mutate(newLink.trim());
    };

    return (
        <div className="add-article-wrapper">
            <label className="save-article-label" htmlFor="save-article-url">Save an article</label>
            <form className="add-article-form" onSubmit={handleImportArticle}>
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
                        {isImporting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                            <FontAwesomeIcon icon={faPlus} />
                        )}
                        <span>{isImporting ? 'Saving…' : 'Save'}</span>
                    </button>
                </div>
            </form>
            <div className="extension-promo" id="save-article-help">
                <FontAwesomeIcon icon={faPuzzlePiece} />
                <span>
                    You can also save as you browse with the <strong>LaterLeaf browser extension.</strong>
                </span>
            </div>
        </div>
    );
};

export default AddArticleForm;