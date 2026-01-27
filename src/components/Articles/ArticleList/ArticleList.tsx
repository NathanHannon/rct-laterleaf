import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '../../../hooks/searchHook';
import { useDebounce } from '../../../hooks/useDebounce'; // Import the new hook
import type { Article } from '../../../interfaces/article';
import ArticleCard from '../ArticleCard/ArticleCard';
import SortDropdown from '../SortDropdown/SortDropdown';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import type { SortOption } from '../../../interfaces/sort';
import './ArticleList.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem } from '@fortawesome/free-solid-svg-icons';
import AddArticleForm from '../AddArticleForm/AddArticleForm';
import { hasProAccess } from '../../../utils/tierUtils';
import { sortArticles } from '../../../utils/sortUtils';
import { motion } from 'motion/react';
import { useUserStatus } from '../../../hooks/useUserStatus';

const ArticleList = () => {
    // const [articles, setArticles] = useState<Article[]>([]);
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { searchTerm, searchMode } = useSearch();
    const { isPro } = useUserStatus(); // Use the context for pro status
    // const [isSearching, setIsSearching] = useState(false);
    const queryClient = useQueryClient();

    // Debounce the search term to prevent API calls on every keystroke
    const debouncedSearchTerm = useDebounce(searchTerm, 400); // 400ms delay

    const { data: articles = [], isLoading } = useQuery({
        queryKey: ['articles', debouncedSearchTerm, searchMode],
        enabled: isLoaded && isSignedIn,
        queryFn: async () => {
            const token = await getToken();
            const trimmedSearch = debouncedSearchTerm.trim();
            let url = '/api/articles';

            // Use search endpoint if term is present (>2 chars for search)
            if (trimmedSearch.length >= 2) {
                url = `/api/search?q=${encodeURIComponent(trimmedSearch)}&mode=${searchMode}`;
            } else if (trimmedSearch.length === 1) {
                // Return empty if 1 char (mimicking original logic)
                return [];
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Fetch failed: ${errorText}`);
            }

            const data = await response.json();

            // Handle search result format wrapper
            if (trimmedSearch.length >= 2) {
                return (data?.results && Array.isArray(data.results)) ? data.results : [];
            }

            return Array.isArray(data) ? data : [];
        }
    });

    // Consolidated data fetching effect - REMOVED in favor of useQuery
    /* const fetchArticles = useCallback(async () => {
        // ... (removed)
    }, [getToken, isLoaded, isSignedIn]); */

    // Original useEffect for search/fetch - REMOVED in favor of useQuery
    /* useEffect(() => {
       // ... (removed)
    }, [debouncedSearchTerm, searchMode, isLoaded, isSignedIn, getToken, fetchArticles]); */

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
    console.log('📋 ArticleList: Pro access status:', isPro, '| User loaded:', isLoaded);

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

    // Use Mutation for Delete
    const deleteMutation = useMutation({
        mutationFn: async (articleId: string) => {
            return handleAction(articleId, '', 'DELETE');
        },
        onSuccess: (_, articleId) => {
            // Option 1: Invalidate and Refetch (Safest)
            // queryClient.invalidateQueries({ queryKey: ['articles'] });

            // Option 2: Optimistic Update (Faster)
            queryClient.setQueryData(['articles', debouncedSearchTerm, searchMode], (old: Article[] | undefined) =>
                old ? old.filter(a => a.id !== articleId) : []
            );
        }
    });

    const confirmDelete = async () => {
        if (!deleteConfirm.articleId) return;

        await deleteMutation.mutateAsync(deleteConfirm.articleId);

        setDeleteConfirm({ show: false, articleId: null });
    };

    // Use Mutation for Archive
    const archiveMutation = useMutation({
        mutationFn: async (articleId: string) => {
            return handleAction(articleId, 'archive');
        },
        onSuccess: (_, articleId) => {
            queryClient.setQueryData(['articles', debouncedSearchTerm, searchMode], (old: Article[] | undefined) =>
                old ? old.map((a: Article) => a.id === articleId ? { ...a, isArchived: !a.isArchived } : a) : []
            );
        }
    });

    const handleArchive = async (articleId: string) => {
        await archiveMutation.mutateAsync(articleId);
    };

    const handleDelete = (articleId: string) => {
        setDeleteConfirm({ show: true, articleId });
    };

    // Use Mutation for Bookmark
    const bookmarkMutation = useMutation({
        mutationFn: async (articleId: string) => {
            return handleAction(articleId, 'bookmark');
        },
        onSuccess: (_, articleId) => {
            queryClient.setQueryData(['articles', debouncedSearchTerm, searchMode], (old: Article[] | undefined) =>
                old ? old.map((a: Article) => a.id === articleId ? { ...a, isBookmarked: !a.isBookmarked } : a) : []
            );
        }
    });

    const handleToggleBookmark = async (articleId: string) => {
        await bookmarkMutation.mutateAsync(articleId);
    };

    if (!isLoaded || isLoading) {
        return <LoadingSpinner size="large" label="Loading your library..." />;
    }

    if (!isSignedIn) {
        return <div>Please sign in to see your articles.</div>;
    }

    const sortedArticles = sortArticles(articles, sortBy);

    const handleSortChange = (newSortBy: SortOption) => {
        setSortBy(newSortBy);
        // Save sort preference to localStorage
        localStorage.setItem('articleSortPreference', newSortBy);
    };

    const toggleSortDropdown = () => {
        setIsSortDropdownOpen(!isSortDropdownOpen);
    };

    const handleArticleAdded = () => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
    };

    return (
        <div className="article-list-container">
            <AddArticleForm onArticleAdded={handleArticleAdded} />
            <div className="list-header">
                <div className="header-left">
                    <h2 className="list-title">My List</h2>
                    {hasProAccess(isPro) && <span className="premium-badge">Pro Search Enabled <FontAwesomeIcon icon={faGem} className="premium-icon" /></span>}
                    {isLoading && <LoadingSpinner size="small" layout="horizontal" label="Loading..." />}
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