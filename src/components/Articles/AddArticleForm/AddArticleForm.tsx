import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';
import { useToastContext } from '../../../context/toastContextUtils';
import { useApiErrorHandler } from '../../../hooks/useApiErrorHandler';
import './AddArticleForm.scss';

interface AddArticleFormProps {
    onArticleAdded: () => void;
}

const AddArticleForm: React.FC<AddArticleFormProps> = ({ onArticleAdded }) => {
    const { getToken } = useAuth();
    const { showSuccess, showWarning } = useToastContext();
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
                    'We couldn\'t extract the content (likely due to a paywall). Try using the LaterLeaf Browser Extension directly on the page for better results!'
                );
            } else {
                showSuccess('Article Saved!', 'The article has been successfully added to your list.');
            }
        },
        onError: (err) => {
            handleGenericError(err, 'Import Failed');
        },
    });

    const isImporting = importMutation.isPending;

    const handleImportArticle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLink || isImporting) return;
        importMutation.mutate(newLink);
    };

    return (
        <div className="add-article-wrapper">
            <form className="add-article-form" onSubmit={handleImportArticle}>
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="Have an article you want to save? Paste the link here..."
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        disabled={isImporting}
                    />
                    <button type="submit" className="save-link-button" disabled={!newLink || isImporting}>
                        {isImporting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                            <FontAwesomeIcon icon={faPlus} />
                        )}
                        <span>Save</span>
                    </button>
                </div>
            </form>
            <div className="extension-promo">
                <FontAwesomeIcon icon={faPuzzlePiece} />
                <span>
                    Pro Tip: Use the <strong>LaterLeaf Browser Extension</strong> to save paywalled articles directly.
                </span>
            </div>
        </div>
    );
};

export default AddArticleForm;