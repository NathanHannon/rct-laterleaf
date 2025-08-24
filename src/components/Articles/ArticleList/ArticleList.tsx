import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import ArticleCard from '../ArticleCard/ArticleCard';
import SortDropdown from '../SortDropdown/SortDropdown';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import type { SortOption } from '../../../interfaces/sort';
import './ArticleList.scss';
import type { Article } from '../../../interfaces/article';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faGem } from '@fortawesome/free-solid-svg-icons';
import AddArticleForm from '../AddArticleForm/AddArticleForm';
import { useSearch } from '../../../hooks/searchHook';
import { hasProAccess } from '../../../utils/tierUtils';
import { sortArticles } from '../../../utils/sortUtils';
import RecommendationList from '../../Recommendations/RecommendationList';

const ArticleList: React.FC = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const { searchTerm } = useSearch();
    const userHasProAccess = hasProAccess(user);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>(() => {
        // Load saved sort preference from localStorage, default to 'newest-first'
        const saved = localStorage.getItem('articleSortPreference');
        return (saved as SortOption) || 'newest-first';
    });
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; articleId: string | null }>({
        show: false,
        articleId: null
    });

    // Log pro status for debugging
    console.log('📋 ArticleList: Pro access status:', userHasProAccess, '| User loaded:', userLoaded);

    const fetchArticles = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/articles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response was not ok: ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetch articles response:', data);

            const articlesArray = Array.isArray(data) ? data : [];
            setArticles(articlesArray);
        } catch (error) {
            console.error("Failed to fetch articles:", error);
            setArticles([]);
        }
    }, [getToken]);

    // Separate effect for search
    useEffect(() => {
        const performSearch = async () => {
            if (!isLoaded || !isSignedIn || !userLoaded) return;

            if (!searchTerm) {
                fetchArticles();
                return;
            }

            setIsSearching(true);
            try {
                const token = await getToken();
                const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const searchResults = await response.json();
                console.log('Search response:', searchResults);
                console.log('First search result:', searchResults[0]); // Check what fields are included

                const resultsArray = Array.isArray(searchResults) ? searchResults :
                    (searchResults.results && Array.isArray(searchResults.results)) ? searchResults.results : [];

                console.log('Processed results array:', resultsArray);
                console.log('First processed result:', resultsArray[0]);

                setArticles(resultsArray);
            } catch (error) {
                console.error("Failed to perform search:", error);
                fetchArticles();
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [searchTerm, isLoaded, isSignedIn, userLoaded, fetchArticles, getToken]);

    // Initial fetch - only run once when component mounts and user is ready
    useEffect(() => {
        if (isLoaded && isSignedIn && userLoaded && !searchTerm) {
            fetchArticles();
        }
    }, [isLoaded, isSignedIn, userLoaded, fetchArticles, searchTerm]);

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isSortDropdownOpen) {
                const target = event.target as Element;
                if (!target.closest('.sort-dropdown')) {
                    setIsSortDropdownOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSortDropdownOpen]);

    const handleAction = async (articleId: string, endpoint: string, method: 'POST' | 'DELETE' = 'POST') => {
        try {
            const token = await getToken();
            const url = endpoint ? `/api/articles/${articleId}/${endpoint}` : `/api/articles/${articleId}`;
            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Action failed: ${endpoint}`);
            return true;
        } catch (error) {
            console.error(`Failed to ${endpoint || 'delete'}:`, error);
            return false;
        }
    };

    const handleDelete = async (articleId: string) => {
        setDeleteConfirm({ show: true, articleId });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.articleId) return;
        const success = await handleAction(deleteConfirm.articleId, '', 'DELETE');
        if (success) setArticles(prev => prev.filter(a => a.id !== deleteConfirm.articleId));
        setDeleteConfirm({ show: false, articleId: null });
    };

    const handleArchive = async (articleId: string) => {
        const success = await handleAction(articleId, 'archive');
        if (success) {
            setArticles(prev => prev.map(a =>
                a.id === articleId ? { ...a, isArchived: !a.isArchived } : a
            ));
        }
    };

    const handleToggleBookmark = async (articleId: string) => {
        const success = await handleAction(articleId, 'bookmark');
        if (success) {
            setArticles(prev => prev.map(a =>
                a.id === articleId ? { ...a, isBookmarked: !a.isBookmarked } : a
            ));
        }
    };

    if (!isLoaded || !userLoaded) {
        return <div className="loading-container"><FontAwesomeIcon icon={faSpinner} spin size="3x" /> Loading...</div>;
    }

    if (!isSignedIn) {
        return <div>Please sign in to see your articles.</div>;
    }

    const validArticles = Array.isArray(articles) ? articles : [];
    const sortedArticles = sortArticles(validArticles, sortBy);

    const handleSortChange = (newSortBy: SortOption) => {
        setSortBy(newSortBy);
        // Save sort preference to localStorage
        localStorage.setItem('articleSortPreference', newSortBy);
    };

    const toggleSortDropdown = () => {
        setIsSortDropdownOpen(!isSortDropdownOpen);
    };

    return (
        <div className="article-list-container">
            <RecommendationList />
            <AddArticleForm onArticleAdded={fetchArticles} />
            <div className="list-header">
                <div className="header-left">
                    <h2 className="list-title">My List</h2>
                    {userHasProAccess && <span className="premium-badge">Pro Search Enabled <FontAwesomeIcon icon={faGem} className="premium-icon" /></span>}
                    {isSearching && <><FontAwesomeIcon icon={faSpinner} spin /> Searching...</>}
                </div>
                <div className="header-right">
                    <SortDropdown
                        sortBy={sortBy}
                        onSortChange={handleSortChange}
                        isOpen={isSortDropdownOpen}
                        onToggle={toggleSortDropdown}
                    />
                </div>
            </div>
            <motion.div
                className="article-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {sortedArticles.filter(article => article.id).map((article) => (
                    <motion.div
                        key={article.id}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                        }}
                        transition={{ duration: 0.4 }}
                    >
                        <ArticleCard
                            article={article}
                            onDelete={handleDelete}
                            onArchive={handleArchive}
                            onToggleBookmark={handleToggleBookmark}
                        />
                    </motion.div>
                ))}
            </motion.div>

            <ConfirmationDialog
                isOpen={deleteConfirm.show}
                title="Delete Article"
                message="Are you sure you want to delete this article? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ show: false, articleId: null })}
            />
        </div>
    );
};

export default ArticleList;