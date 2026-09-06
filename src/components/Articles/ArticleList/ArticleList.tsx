import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '../../../hooks/searchHook';
import { useDebounce } from '../../../hooks/useDebounce';
import { useArticleActions } from '../../../hooks/useArticleActions';
import type { Article } from '../../../interfaces/article';
import ArticleCard from '../ArticleCard/ArticleCard';
import SortDropdown from '../SortDropdown/SortDropdown';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import type { SortOption } from '../../../interfaces/sort';
import AddArticleForm from '../AddArticleForm/AddArticleForm';
import { sortArticles } from '../../../utils/sortUtils';
import { useToastContext } from '../../../context/toastContextUtils';
import { TIP_STORAGE_KEYS, getKeyboardShortcutLabel, hasSeenTip, markTipSeen, notificationTips } from '../../../constants/notificationTips';
import './ArticleList.scss';

const ArticleList = () => {
    const { getToken, isLoaded, isSignedIn, userId } = useAuth();
    const { searchTerm, setSearchTerm, searchMode } = useSearch();
    const queryClient = useQueryClient();
    const debouncedSearchTerm = useDebounce(searchTerm, 400).trim();
    const isSearch = searchTerm.trim().length > 0;
    const isShortSearch = searchTerm.trim().length === 1;
    const isSearchSettling = searchTerm.trim() !== debouncedSearchTerm;
    const actionMutation = useArticleActions();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data: articles = [], isLoading, isFetching, isError, refetch } = useQuery({
        queryKey: ['articles', 'library', userId, debouncedSearchTerm, searchMode],
        enabled: isLoaded && !!isSignedIn,
        queryFn: async ({ signal }) => {
            if (debouncedSearchTerm.length === 1) return [];
            const token = await getToken();
            const searching = debouncedSearchTerm.length >= 2;
            const url = searching
                ? `/api/search?q=${encodeURIComponent(debouncedSearchTerm)}&mode=${searchMode}`
                : '/api/articles';
            const response = await fetch(url, { signal, headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error('Unable to load your library.');
            const data = await response.json();
            const results = searching ? data?.results : data;
            if (!Array.isArray(results)) throw new Error('Unexpected library response.');
            return results as Article[];
        },
    });

    const [sortBy, setSortBy] = useState<SortOption>(() => {
        const saved = localStorage.getItem('articleSortPreference');
        const valid: SortOption[] = ['newest-first', 'oldest-first', 'alphabetical', 'alphabetical-reverse', 'bookmarks-first'];
        return valid.includes(saved as SortOption) ? saved as SortOption : 'newest-first';
    });
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const { showInfo } = useToastContext();

    useEffect(() => {
        if (!isLoaded || !isSignedIn || hasSeenTip(TIP_STORAGE_KEYS.commandPalette)) return;
        const visitKey = 'laterleaf_visit_count';
        const visits = parseInt(localStorage.getItem(visitKey) || '0', 10) + 1;
        localStorage.setItem(visitKey, String(visits));
        if (visits >= 3) {
            showInfo(notificationTips.commandPalette.title, notificationTips.commandPalette.message(getKeyboardShortcutLabel()), 8000);
            markTipSeen(TIP_STORAGE_KEYS.commandPalette);
        }
    }, [isLoaded, isSignedIn, showInfo]);

    useEffect(() => {
        if (!isSortDropdownOpen) return;
        const handleOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.sort-dropdown')) setIsSortDropdownOpen(false);
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsSortDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isSortDropdownOpen]);

    const confirmDelete = () => {
        if (!deletingId || actionMutation.isPending) return;
        actionMutation.mutate({ articleId: deletingId, action: 'delete' }, { onSuccess: () => setDeletingId(null) });
    };

    if (!isLoaded) return <LoadingSpinner size="large" label="Loading your library..." />;
    if (!isSignedIn) return <p>Please sign in to see your library.</p>;

    const sortedArticles = sortArticles(articles.filter(article => article.id && !article.isArchived), sortBy);
    const busy = isLoading || isSearchSettling;
    const canShowEmpty = !busy && !isError && sortedArticles.length === 0;

    return (
        <div className="article-list-container">
            <header className="list-header-premium">
                <div className="header-top">
                    <div className="header-left"><p className="library-eyebrow">A little space for a good read</p><h1 className="list-title">Your library</h1></div>
                    {!busy && sortedArticles.length > 0 && <SortDropdown sortBy={sortBy} onSortChange={(value) => { setSortBy(value); localStorage.setItem('articleSortPreference', value); }} isOpen={isSortDropdownOpen} onToggle={() => setIsSortDropdownOpen(!isSortDropdownOpen)} />}
                </div>
                <p className="list-subtitle">Everything you saved, ready when you are.</p>
            </header>
            <AddArticleForm onArticleAdded={() => { void queryClient.invalidateQueries({ queryKey: ['articles'] }); }} />
            {isError && <section className="library-state library-state--error" role="alert"><h2>{isSearch ? 'Search is taking a moment.' : 'We couldn’t load your library.'}</h2><p>Please check your connection and try again.</p><button onClick={() => { void refetch(); }} disabled={isFetching}>{isFetching ? 'Trying again…' : 'Try again'}</button></section>}
            {busy && <LoadingSpinner size="large" label={isSearch ? 'Searching your library...' : 'Loading your library...'} />}
            {!busy && isShortSearch && <section className="library-state" role="status"><h2>Keep typing to search.</h2><p>Enter at least two characters to find an article.</p><button onClick={() => setSearchTerm('')}>Back to your library</button></section>}
            {canShowEmpty && !isShortSearch && (isSearch
                ? <section className="library-state" role="status"><p className="library-eyebrow">No matches this time</p><h2>No articles found for “{debouncedSearchTerm}”.</h2><p>Try a title, an author, or a different word from the article.</p><button onClick={() => setSearchTerm('')}>Clear search</button></section>
                : <section className="library-state library-state--welcome"><span className="library-leaf" aria-hidden="true">❧</span><p className="library-eyebrow">Your reading starts here</p><h2>Start with something that caught your eye.</h2><p>Paste an article link above. Then open it for a quiet read, or start with the key points.</p><button onClick={() => document.getElementById('save-article-url')?.focus()}>Save your first article <span aria-hidden="true">↑</span></button><ol className="library-first-steps"><li><strong>01 / Save</strong><span>Give a good article a home.</span></li><li><strong>02 / Read</strong><span>Make a moment for the full story.</span></li><li><strong>03 / Return</strong><span>Favorite it or add it to a collection.</span></li></ol><Link to="/import">Already have a reading list? Import your articles</Link></section>
            )}
            {!busy && !isShortSearch && sortedArticles.length > 0 && <><p className="library-results" role="status">{sortedArticles.length} {isSearch ? (sortedArticles.length === 1 ? 'result' : 'results') : (sortedArticles.length === 1 ? 'article' : 'articles')}{isFetching ? ' · Updating…' : ''}</p><div className="article-grid">{sortedArticles.map(article => <ArticleCard key={article.id} article={article} onDelete={setDeletingId} onArchive={(articleId) => actionMutation.mutate({ articleId, action: 'archive' })} onToggleBookmark={(articleId) => actionMutation.mutate({ articleId, action: 'bookmark' })} isActionPending={actionMutation.isPending} />)}</div></>}
            <ConfirmationDialog isOpen={deletingId !== null} title="Delete article?" message="This removes the article from your library. This action cannot be undone." confirmText={actionMutation.isPending ? 'Deleting…' : 'Delete article'} variant="danger" isPending={actionMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeletingId(null)} />
        </div>
    );
};

export default ArticleList;
