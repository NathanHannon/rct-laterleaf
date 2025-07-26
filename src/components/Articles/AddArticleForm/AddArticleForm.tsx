import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './AddArticleForm.scss';

interface AddArticleFormProps {
    onArticleAdded: () => void;
}

const AddArticleForm: React.FC<AddArticleFormProps> = ({ onArticleAdded }) => {
    const { getToken } = useAuth();
    const [newLink, setNewLink] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState('');

    const handleImportArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLink || isImporting) return;

        setIsImporting(true);
        setError('');

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
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to import article');
            }

            setNewLink('');
            onArticleAdded(); // Notify parent to refresh
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
            {error && <p className="import-error">{error}</p>}
        </form>
    );
};

export default AddArticleForm; 