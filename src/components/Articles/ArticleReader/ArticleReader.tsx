import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import type { Article } from '../../../interfaces/article';
import CollectionSelector from '../../Collections/CollectionSelector/CollectionSelector';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import ArticlePodcastPlayer from '../ArticlePodcastPlayer/ArticlePodcastPlayer';
import RelatedArticles from '../RelatedArticles/RelatedArticles';
import TagsManager from '../../TagsManager/TagsManager';
import './ArticleReader.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faArchive, faTrash, faRotateRight, faFolderPlus, faEllipsisV, faGem, faClock, faStarHalfStroke, faPodcast } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
import { hasProAccess } from '../../../utils/tierUtils';
import { useUserStatus } from '../../../hooks/useUserStatus';
import { useUserCredits } from '../../../hooks/useUserCredits';
// import { LANGUAGES } from '../../../constants/languages';

const ArticleReader = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const { getToken } = useAuth();
    const { isPro } = useUserStatus();
    const { credits, fetchCredits } = useUserCredits();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Replaced manual fetch with TanStack Query
    const { data: article, isLoading: loading, error: queryError } = useQuery({
        queryKey: ['article', articleId],
        queryFn: async () => {
            if (!articleId) return null;
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch article');
            const data = await response.json();

            // Sync summary status with local metadata if needed
            if (data.summaryStatus === 'pending') {
                setSummaryMetadata(prev => ({ ...prev, status: 'pending' }));
                setShowSummary(true);
            }
            return data as Article;
        },
        enabled: !!articleId,
        refetchInterval: (query) => {
            // Poll if summary is pending
            return query.state.data?.summaryStatus === 'pending' ? 1000 : false;
        }
    });

    const [localError, setLocalError] = useState<string | null>(null);
    const error = localError || (queryError ? (queryError as Error).message : null);
    const setError = setLocalError;

    // Helper to maintain compatibility with existing handlers that use setArticle
    // This updates the TanStack Query cache directly
    const setArticle = (updaterOrValue: Article | null | undefined | ((prev: Article | null | undefined) => Article | null | undefined)) => {
        queryClient.setQueryData(['article', articleId], (old: Article | null | undefined) => {
            const newVal = typeof updaterOrValue === 'function'
                ? (updaterOrValue as (prev: Article | null | undefined) => Article | null | undefined)(old)
                : updaterOrValue;
            return newVal === undefined ? old : newVal;
        });
    };

    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
    const [showPodcastPlayer, setShowPodcastPlayer] = useState(false);
    const [isChatMode, setIsChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string, timestamp?: string }[]>([]);
    const [isGeneratingChat, setIsGeneratingChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [showCollectionSelector, setShowCollectionSelector] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteSummaryConfirm, setShowDeleteSummaryConfirm] = useState(false);
    const [useProSummary, setUseProSummary] = useState(false);
    // const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
    // const [showSummaryLangDropdown, setShowSummaryLangDropdown] = useState(false);
    // const [isTranslating, setIsTranslating] = useState(false);
    // const [currentLanguage, setCurrentLanguage] = useState<string>('original');

    /* const getLanguageName = (code: string) => {
        return LANGUAGES.find(l => l.code === code)?.name || 'English';
    };

    const handleTranslate = async (langCode: string) => {
        if (!articleId) return;
        setShowTranslateDropdown(false);

        if (langCode === 'original') {
            setCurrentLanguage('original');
            return; // Switch back to original content
        }

        setIsTranslating(true);
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetLanguage: langCode })
            });

            if (!response.ok) throw new Error('Translation failed');

            const data = await response.json();

            // Store translation in local state to display it
            // We modify the displayed article object temporarily without reloading from DB
            setArticle(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    contentHtml: undefined, // Force markdown rendering for translation
                    content: data.translation
                };
            });

            setCurrentLanguage(langCode);
        } catch {
            setError('Translation failed. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleRestoreOriginal = async () => {
        // Re-fetch original article to restore content
        setLoading(true);
        try {
            // Basic fetch again to act as "restore"
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setArticle(data);
            setCurrentLanguage('original');
        } catch {
            setError('Failed to restore original text');
        } finally {
            setLoading(false);
        }
    }; */

    const [summaryMetadata, setSummaryMetadata] = useState<{
        model?: string;
        fallbackUsed?: boolean;
        status?: 'completed' | 'pending';
    }>({});

    // Podcast player states
    // New states for reading progress and time estimation
    const [readingProgress, setReadingProgress] = useState(0);
    const [estimatedReadingTime, setEstimatedReadingTime] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    // Check if user has pro access for chat functionality
    const userHasProAccess = hasProAccess(isPro);

    // Use contentHtml for display, falling back to content if it doesn't exist
    const displayContent = article?.contentHtml || article?.content || '';

    // Calculate estimated reading time (average 200 words per minute)
    const calculateReadingTime = (content: string) => {
        const plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
        const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
        return Math.ceil(wordCount / 200); // 200 words per minute average
    };

    // Handle scroll for reading progress
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const contentElement = contentRef.current;
            const scrollTop = window.scrollY;
            const contentTop = contentElement.offsetTop;
            const contentHeight = contentElement.scrollHeight;
            const windowHeight = window.innerHeight;

            // Calculate progress based on how much of the content has been scrolled past
            const scrollableDistance = contentHeight - windowHeight;
            const scrollProgress = Math.max(0, scrollTop - contentTop);
            const progress = scrollableDistance > 0 ? Math.min(100, (scrollProgress / scrollableDistance) * 100) : 0;

            setReadingProgress(progress);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [article]);

    // Close menus on scroll to update UI cleanly
    useEffect(() => {
        const handleScroll = () => {
            // if (showTranslateDropdown) setShowTranslateDropdown(false);
            if (showDropdown) setShowDropdown(false);
        };

        // if (showTranslateDropdown || showDropdown) {
        if (showDropdown) {
            window.addEventListener('scroll', handleScroll);
        }

        return () => window.removeEventListener('scroll', handleScroll);
        // }, [showTranslateDropdown, showDropdown]);
    }, [showDropdown]);

    // Calculate reading time when article loads
    useEffect(() => {
        if (article?.content) {
            const readingTime = calculateReadingTime(article.content);
            setEstimatedReadingTime(readingTime);
        }
    }, [article]);

    // Fetch user credits on mount
    useEffect(() => {
        fetchCredits();
    }, []);

    const handleFavorite = async () => {
        if (!articleId || !article) return;

        setIsBookmarkAnimating(true);
        setTimeout(() => setIsBookmarkAnimating(false), 600);

        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/bookmark`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to bookmark article');
            }
            // Update local state to reflect the change immediately
            setArticle(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleSummarize = async () => {
        if (!articleId || !article) return;

        // If summary already exists, just toggle display
        if (article.summary && article.summaryStatus !== 'pending') {
            setShowSummary(!showSummary);
            return;
        }

        setIsGeneratingSummary(true);
        try {
            const token = await getToken();
            const url = `/api/articles/${articleId}/summarize${useProSummary && !userHasProAccess ? '?usePro=true' : ''}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate summary');
            }

            const data = await response.json();
            setArticle(prev => prev ? { ...prev, summary: data.summary, summaryStatus: data.status, summaryLanguage: 'en' } : null);
            // Store metadata about the summary generation
            setSummaryMetadata({
                model: data.model,
                fallbackUsed: data.fallbackUsed,
                status: data.status
            });
            setShowSummary(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate summary');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleRefreshSummary = async (useProOverride?: boolean, languageCode?: string) => {
        if (!articleId || !article) return;

        // Use provided language, or fall back to current summary language, or default to English
        const targetLangCode = languageCode || article.summaryLanguage || 'en';

        setIsGeneratingSummary(true);
        // if (languageCode) setShowSummaryLangDropdown(false);

        try {
            const token = await getToken();
            const effectiveUsePro = typeof useProOverride === 'boolean' ? useProOverride : (useProSummary && !userHasProAccess);

            // Build query params
            const params = new URLSearchParams({ force: 'true' });
            if (effectiveUsePro) params.append('usePro', 'true');

            // Send the ISO code (e.g., 'es') directly to the backend
            if (targetLangCode) params.append('language', targetLangCode);

            const url = `/api/articles/${articleId}/summarize?${params.toString()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate summary');
            }

            const data = await response.json();
            // Optimistically update the language if we requested a specific one
            const newLang = languageCode || article.summaryLanguage || 'en';

            setArticle(prev => prev ? {
                ...prev,
                summary: data.summary,
                summaryStatus: data.status,
                summaryLanguage: newLang
            } : null);

            // Update metadata for refreshed summary
            setSummaryMetadata({
                model: data.model,
                fallbackUsed: data.fallbackUsed,
                status: data.status
            });
            setShowSummary(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to regenerate summary');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleDeleteSummary = () => {
        setShowDeleteSummaryConfirm(true);
    };

    const confirmDeleteSummary = async () => {
        if (!articleId || !article) return;
        setShowDeleteSummaryConfirm(false);

        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/summary`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete summary');
            }

            // Update local state
            setArticle(prev => prev ? { ...prev, summary: undefined } : null);
            setShowSummary(false);
            setSummaryMetadata({});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete summary');
        }
    };

    const handleArchive = async () => {
        if (!articleId || !article) return;
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/archive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to archive article');
            }
            // Update local state to reflect the change immediately
            setArticle(prev => prev ? { ...prev, isArchived: !prev.isArchived } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleDelete = async () => {
        if (!articleId) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!articleId) return;
        setShowDeleteConfirm(false);
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                navigate('/articles');
            } else {
                throw new Error('Failed to delete article');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleDropdownAction = (action: () => void) => {
        action();
        setShowDropdown(false);
    };

    // Use contentHtml for display, falling back to content if it doesn't exist

    const handleSendMessage = async (message: string) => {
        if (!article || !message.trim()) return;

        // Double-check pro access when sending messages
        if (!userHasProAccess) {
            alert('Chat functionality is available for Pro users only. Please upgrade to access this feature.');
            return;
        }

        setIsGeneratingChat(true);

        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate chat response');
            }

            const data = await response.json();
            // Update with the complete chat history from server
            setChatMessages(data.chatHistory || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate chat response');
        } finally {
            setIsGeneratingChat(false);
        }
    };

    const handleExitChat = () => {
        setIsChatMode(false);
        setChatMessages([]);
    };

    if (loading) {
        return <LoadingSpinner size="large" label="Loading article..." />;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!article) {
        return <div>Article not found.</div>;
    }

    return (
        <div className="article-reader">
            {/* Reading Progress Bar */}
            <div className="reading-progress-bar">
                <div
                    className="reading-progress-fill"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            <div className="article-actions">
                <motion.button
                    onClick={handleFavorite}
                    className={`button-favorite ${article.isBookmarked ? 'bookmarked' : ''}`}
                    whileTap={{ scale: 0.95 }}
                    animate={isBookmarkAnimating ? {
                        scale: [1, 1.1, 1],
                        rotateZ: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.3 }}
                >
                    <FontAwesomeIcon icon={article.isBookmarked ? faBookmarkSolid : faBookmarkRegular} />
                    <span>{article.isBookmarked ? 'Remove' : 'Bookmark'}</span>
                </motion.button>

                <button
                    onClick={handleSummarize}
                    className={`button-summarize ${article.summary ? 'has-summary' : ''} ${isGeneratingSummary ? 'loading' : ''} ${article.hasContent === false ? 'disabled' : ''}`}
                    disabled={isGeneratingSummary || article.hasContent === false}
                    title={article.hasContent === false ? "Summary unavailable for paywalled content" : "Generate AI Summary"}
                >
                    <FontAwesomeIcon icon={faStarHalfStroke} />
                    <span>
                        {isGeneratingSummary ? 'Generating...' :
                            (article.summary || article.summaryStatus === 'pending') ? (showSummary ? 'Hide Summary' : 'Show Summary') :
                                'Summarize'}
                    </span>
                </button>

                {/* Podcast Player Toggle Button */}
                <button
                    onClick={() => setShowPodcastPlayer(!showPodcastPlayer)}
                    className={`button-podcast ${article.hasContent === false ? 'disabled' : ''}`}
                    disabled={article.hasContent === false}
                    title={article.hasContent === false ? "Audio unavailable for paywalled content" : "Listen to this article"}
                >
                    <FontAwesomeIcon icon={faPodcast} />
                    <span>{showPodcastPlayer ? 'Hide Podcast' : 'Show Podcast'}</span>
                </button>

                {/* Translation Dropdown */}
                {/* <div className="action-dropdown-container">
                    <button
                        className={`button-translate ${currentLanguage !== 'original' ? 'active' : ''}`}
                        onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                        disabled={isTranslating}
                    >
                        {isTranslating ? (
                            <FontAwesomeIcon icon={faRotateRight} spin />
                        ) : currentLanguage !== 'original' ? (
                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                                {LANGUAGES.find(l => l.code === currentLanguage)?.flag}
                            </span>
                        ) : (
                            <FontAwesomeIcon icon={faLanguage} />
                        )}
                        <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                    </button>

                    <AnimatePresence>
                        {showTranslateDropdown && (
                            <motion.div
                                className="action-dropdown-menu translation-menu"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <button
                                    className={`dropdown-item ${currentLanguage === 'original' ? 'active' : ''}`}
                                    onClick={() => currentLanguage === 'original' ? setShowTranslateDropdown(false) : handleRestoreOriginal()}
                                >
                                    <span className="lang-flag">📄</span>
                                    Original Text
                                    {currentLanguage === 'original' && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
                                </button>
                                <div className="dropdown-divider" />
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`dropdown-item ${currentLanguage === lang.code ? 'active' : ''}`}
                                        onClick={() => handleTranslate(lang.code)}
                                    >
                                        <span className="lang-flag">{lang.flag}</span>
                                        {lang.name}
                                        {currentLanguage === lang.code && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div> */}

                {/* Pro Summary Toggle for Free Users */}
                {!userHasProAccess && (
                    <div className="pro-toggle-container">
                        <span className="toggle-label">
                            <FontAwesomeIcon icon={faGem} />
                            Pro Summary
                        </span>
                        <label className="toggle-switch">
                            <input
                                id="pro-toggle"
                                type="checkbox"
                                checked={useProSummary}
                                onChange={(e) => setUseProSummary(e.target.checked)}
                                disabled={isGeneratingSummary || (credits?.proCreditsRemaining === 0 && !useProSummary)}
                            />
                            <span className="slider round"></span>
                        </label>

                        {/* Credit Counters for Free Users */}
                        {credits && (
                            <div className="credit-counters">
                                <div className="credit-item" title="Pro summaries remaining this month">
                                    <span className="credit-label">Pro:</span>
                                    <span className={`credit-value ${credits.proCreditsRemaining === 0 ? 'empty' : ''}`}>
                                        {credits.proCreditsRemaining}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="actions-dropdown">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="dropdown-toggle"
                    >
                        <FontAwesomeIcon icon={faEllipsisV} />
                    </button>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                className="dropdown-menu"
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <button
                                    onClick={() => handleDropdownAction(() => setShowCollectionSelector(true))}
                                    className="dropdown-item collection-item"
                                >
                                    <FontAwesomeIcon icon={faFolderPlus} />
                                    <span>Add to Collection</span>
                                </button>
                                <button
                                    onClick={() => handleDropdownAction(handleArchive)}
                                    className="dropdown-item archive-item"
                                >
                                    <FontAwesomeIcon icon={faArchive} />
                                    <span>{article.isArchived ? 'Unarchive' : 'Archive'}</span>
                                </button>
                                <button
                                    onClick={() => handleDropdownAction(handleDelete)}
                                    className="dropdown-item delete-item"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                    <span>Delete</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {article.userArticleId && <TagsManager userArticleId={article.userArticleId} />}

            <div className="article-header">
                <h1>{article.title}</h1>
                <div className="article-meta">
                    <div className="article-author">By {article.author || 'Unknown author'}</div>
                    {article.publishDate && <div className="article-date">Published on: {new Date(article.publishDate).toLocaleDateString()}</div>}
                    {estimatedReadingTime > 0 && (
                        <div className="reading-time">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{estimatedReadingTime} min read</span>
                        </div>
                    )}
                </div>
            </div>


            {/* AI Summary Panel */}
            <AnimatePresence>
                {showSummary && (article.summary || article.summaryStatus === 'pending') && (
                    <motion.div
                        className="ai-summary-panel"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '2rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="summary-header">
                            <div className="summary-title">
                                <h3>{isChatMode ? '💬 Article Chat' : '✨ AI Summary'}</h3>
                                <div className="summary-subtitle">
                                    <small>Generated by AI • Not editorial judgment</small>
                                    {/* Status indicators */}
                                    {article.summaryStatus === 'pending' && (
                                        <span className="status-badge pending">
                                            ⏳ Processing in background
                                        </span>
                                    )}
                                    {summaryMetadata.fallbackUsed && article.summaryStatus === 'completed' && (
                                        <span className="status-badge fallback" title="Primary AI model was busy, used backup model">
                                            🔄 Backup model used
                                        </span>
                                    )}
                                    {summaryMetadata.model && !summaryMetadata.fallbackUsed && (
                                        <span className="status-badge success" title={`Generated using ${summaryMetadata.model}`}>
                                            ✅ {summaryMetadata.model?.includes('3-flash') || summaryMetadata.model?.includes('2.5-pro') ? 'Pro model' : 'Standard model'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="summary-actions">
                                {!isChatMode && (
                                    <>
                                        {/* Summary Language Selector */}
                                        {/* <div className="summary-language-selector">
                                            <button
                                                onClick={() => setShowSummaryLangDropdown(!showSummaryLangDropdown)}
                                                className="summary-language-btn"
                                                title="Change summary language"
                                            >
                                                <FontAwesomeIcon icon={faLanguage} />
                                                <span>{getLanguageName(article.summaryLanguage || 'en')}</span>
                                            </button>
                                            {showSummaryLangDropdown && (
                                                <div className="summary-lang-dropdown">
                                                    {LANGUAGES.map(lang => (
                                                        <button
                                                            key={lang.code}
                                                            onClick={() => handleRefreshSummary(undefined, lang.code)}
                                                            className={article.summaryLanguage === lang.code ? 'active' : ''}
                                                        >
                                                            <span className="flag">{lang.flag}</span>
                                                            <span className="name">{lang.name}</span>
                                                            {article.summaryLanguage === lang.code && <FontAwesomeIcon icon={faCheck} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div> */}

                                        <button
                                            onClick={() => handleRefreshSummary()}
                                            className="refresh-summary-button"
                                            disabled={isGeneratingSummary}
                                            title="Regenerate summary"
                                        >
                                            <FontAwesomeIcon
                                                icon={faRotateRight}
                                                className={isGeneratingSummary ? 'spinning' : ''}
                                            />
                                        </button>
                                        <button
                                            onClick={handleDeleteSummary}
                                            className="delete-summary-button"
                                            title="Delete summary"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                        <button
                                            className="close-panel-button"
                                            onClick={() => setShowSummary(false)}
                                            title="Close Summary"
                                        >
                                            ✕
                                        </button>
                                    </>
                                )}
                                {isChatMode && (
                                    <button
                                        onClick={handleExitChat}
                                        className="exit-chat-button"
                                        title="Exit chat mode"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="summary-content">
                            {/* Show pending message if status is pending */}
                            {article.summaryStatus === 'pending' ? (
                                <div className="pending-summary">
                                    <div className="pending-animation">
                                        <div className="spinner"></div>
                                    </div>
                                    <p>Generating your summary... This may take a few minutes.</p>
                                </div>
                            ) : (
                                // Regular summary/chat content
                                <>
                                    {!isChatMode ? (
                                        <ReactMarkdown>{article.summary}</ReactMarkdown>
                                    ) : (
                                        // Chat interface
                                        <div className="chat-interface">
                                            <div className="chat-messages">
                                                {chatMessages.map((msg, index) => (
                                                    <div
                                                        key={index}
                                                        className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                                                    >
                                                        <div className="message-content">
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                ))}
                                                {isGeneratingChat && (
                                                    <div className="chat-message assistant-message">
                                                        <div className="message-content">
                                                            <div className="typing-indicator">
                                                                <span></span>
                                                                <span></span>
                                                                <span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="chat-input">
                                                <form onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (chatInput.trim()) {
                                                        handleSendMessage(chatInput);
                                                        setChatInput('');
                                                    }
                                                }}>
                                                    <input
                                                        type="text"
                                                        value={chatInput}
                                                        onChange={(e) => setChatInput(e.target.value)}
                                                        placeholder="Ask a question about this article..."
                                                        disabled={isGeneratingChat}
                                                        className="chat-input-field"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={isGeneratingChat || !chatInput.trim()}
                                                        className="chat-send-button"
                                                    >
                                                        Send
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Podcast Player - Enhanced audio experience */}
            <AnimatePresence>
                {article.content && articleId && showPodcastPlayer && (
                    <motion.div
                        className="article-audio-section"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <ArticlePodcastPlayer
                            articleId={articleId}
                            title={article.title || 'Article Audio'}
                            className="article-podcast-player"
                            onClose={() => setShowPodcastPlayer(false)}
                        // selectedLanguage={currentLanguage}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Related Articles from User's Library */}
            {articleId && !article.isUrlOnly && (
                <RelatedArticles articleId={articleId} />
            )}

            <div className="article-source">
                <p>This content is republished from <a href={article.url} target="_blank" rel="noopener noreferrer">the original source</a> for personal use. All rights belong to the original author and publisher.</p>
            </div>
            <hr />
            <div
                ref={contentRef}
                className="article-content"
                dangerouslySetInnerHTML={{ __html: displayContent }}
            />

            <CollectionSelector
                isOpen={showCollectionSelector}
                onClose={() => setShowCollectionSelector(false)}
                articleId={article.id ?? ''}
            />

            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                title="Delete Article"
                message="Are you sure you want to delete this article? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <ConfirmationDialog
                isOpen={showDeleteSummaryConfirm}
                title="Delete Summary"
                message="Are you sure you want to delete this AI-generated summary?"
                confirmText="Delete Summary"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeleteSummary}
                onCancel={() => setShowDeleteSummaryConfirm(false)}
            />
        </div>
    );
};

export default ArticleReader;
