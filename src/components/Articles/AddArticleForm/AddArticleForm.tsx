import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
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
    const [isImporting, setIsImporting] = useState(false);

    const handleImportArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLink || isImporting) return;

        setIsImporting(true);

        try {
            const token = await getToken();
            const response = await fetch('/api/articles/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: newLink })
            });

            if (!response.ok) {
                await handleApiError(response, 'Save Failed');
                return;
            }

            const data = await response.json();

            if (data.success === false) {
                setNewLink('');
                onArticleAdded();
                // It was saved as a URL-only bookmark
                showWarning(
                    'Saved Link Only',
                    'We couldn\'t extract the content (likely due to a paywall). Try using the LaterLeaf Browser Extension directly on the page for better results!'
                );
                return;
            }

            setNewLink('');
            onArticleAdded();
            showSuccess('Article Saved!', 'The article has been successfully added to your list.');

        } catch (err) {
            handleGenericError(err, 'Import Failed');
        } finally {
            setIsImporting(false);
        }
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