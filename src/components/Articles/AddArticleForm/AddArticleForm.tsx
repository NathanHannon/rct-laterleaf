import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useToastContext } from '../../../context/toastContextUtils';
import { useApiErrorHandler } from '../../../hooks/useApiErrorHandler';
import './AddArticleForm.scss';

interface AddArticleFormProps {
    onArticleAdded: () => void;
}

const AddArticleForm: React.FC<AddArticleFormProps> = ({ onArticleAdded }) => {
    const { getToken } = useAuth();
    const { showSuccess } = useToastContext();
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
    );
};

export default AddArticleForm;