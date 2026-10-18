import { apiUrl } from '../../../constants/api';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import CollectionSelector from '../../Collections/CollectionSelector/CollectionSelector';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import ArticlePodcastPlayer from '../ArticlePodcastPlayer/ArticlePodcastPlayer';
import ArticleAudioPlayer from '../ArticleAudioPlayer/ArticleAudioPlayer';
import RelatedArticles from '../RelatedArticles/RelatedArticles';
import TagsManager from '../../TagsManager/TagsManager';
import ArticleChat from '../ArticleChat/ArticleChat';
import SelectionToolbar from '../SelectionToolbar/SelectionToolbar';
import './ArticleReader.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faHeart as faHeartSolid, faArchive, faTrash, faRotateRight, faFolderPlus, faEllipsisV, faClock, faStarHalfStroke, faPodcast, faHeadphones, faLanguage, faCheck, faCloudArrowDown, faCloud, faComments } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular, faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { hasProAccess } from '../../../utils/tierUtils';
import { useUserStatus } from '../../../hooks/useUserStatus';
import { useReadingPreferences } from '../../../hooks/useReadingPreferences';
import { LANGUAGES } from '../../../constants/languages';
import { useReaderArticle } from '../../../hooks/useReaderArticle';
import ArticleSummaryPanel from './ArticleSummaryPanel';
import { useLanguageDetection } from '../../../hooks/useLanguageDetection';
import { useCommandContext } from '../../../context/commandContext';
import type { CommandItem } from '../../../context/commandContext';
import type { AdminAccess, AiProvider } from '../../../interfaces/admin';
import { useToastContext } from '../../../context/toastContextUtils';

type SummaryProvider = AiProvider | 'default';

interface SummarySoftCapWarning {
    enabled: boolean;
    limit: number;
    remaining: number;
    threshold: number;
}

interface SummaryResponse {
    summary: string;
    model?: string;
    status: 'completed' | 'pending';
    fallbackUsed?: boolean;
    softCapWarning?: SummarySoftCapWarning | null;
}

const ArticleReader = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const { getToken } = useAuth();
    const { isPro } = useUserStatus();
    const { readingTheme, currentFontOption } = useReadingPreferences();
    const { showWarning } = useToastContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: adminAccess } = useQuery({
        queryKey: ['admin', 'access'],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch(apiUrl('/admin/check-access'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to check admin access');
            return response.json() as Promise<AdminAccess>;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    const { data: article, isLoading: loading, error: queryError, setArticle,
        isAvailableOffline, isSavingOffline, handleToggleOffline } = useReaderArticle(articleId);
    const [localError, setLocalError] = useState<string | null>(null);
    const error = localError || queryError?.message;
    const setError = setLocalError;

    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    useEffect(() => {
        if (article?.summaryStatus === 'pending') setShowSummary(true);
    }, [article?.summaryStatus]);
    const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);
    const [showPodcastPlayer, setShowPodcastPlayer] = useState(false);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [isChatMode, setIsChatMode] = useState(false);
    const [showCollectionSelector, setShowCollectionSelector] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteSummaryConfirm, setShowDeleteSummaryConfirm] = useState(false);
    const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<string>('original');
    const [summaryProvider, setSummaryProvider] = useState<SummaryProvider>('default');

    const detectedLanguage = useLanguageDetection(article?.content);

    const showSummaryCreditWarning = (softCapWarning?: SummarySoftCapWarning | null) => {
        if (!softCapWarning?.enabled) return;

        const summaryLabel = softCapWarning.remaining === 1 ? 'summary' : 'summaries';
        showWarning(
            'Approaching your monthly summary limit',
            `${softCapWarning.remaining} free ${summaryLabel} remaining this month.`,
        );
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
            const response = await fetch(apiUrl(`/articles/${articleId}/translate`), {
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
        try {
            // Invalidate the query to trigger a refetch
            await queryClient.invalidateQueries({ queryKey: ['article', articleId] });
            setCurrentLanguage('original');
        } catch {
            setError('Failed to restore original text');
        }
    };

    const [summaryMetadata, setSummaryMetadata] = useState<{
        model?: string;
        fallbackUsed?: boolean;
        status?: 'completed' | 'pending';
    }>({});

    // Podcast player states
    // New states for reading progress and time estimation
    const [readingProgress, setReadingProgress] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    // Check if user has pro access for chat functionality
    const userHasProAccess = hasProAccess(isPro);

    // Use contentHtml for display, falling back to content if it doesn't exist
    const displayContent = article?.contentHtml || article?.content || '';

    // Calculate estimated reading time - now prefers the backend-persisted value
    const estimatedReadingTime = article?.readingTime || (article?.content
        ? Math.ceil(article.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length / 225)
        : 0);

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
            if (showTranslateDropdown) setShowTranslateDropdown(false);
            if (showDropdown) setShowDropdown(false);
        };

        if (showTranslateDropdown || showDropdown) {
            window.addEventListener('scroll', handleScroll);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [showTranslateDropdown, showDropdown]);

    // --- Context-Aware Command Palette Registration ---
    const { registerCommand, unregisterCommand } = useCommandContext();

    useEffect(() => {
        if (!article || !articleId) return;

        const cmds: CommandItem[] = [
            // --- Article Actions ---
            {
                id: 'article-bookmark',
                label: article.isBookmarked ? 'Remove from Favorites' : 'Add to Favorites',
                icon: article.isBookmarked ? faBookmarkSolid : faBookmarkRegular,
                section: 'Article Actions',
                action: () => handleFavorite()
            },
            {
                id: 'article-like',
                label: article.isLiked ? 'Unlike Article' : 'Like Article',
                icon: article.isLiked ? faHeartSolid : faHeartRegular,
                section: 'Article Actions',
                action: () => handleLike()
            },
            {
                id: 'article-archive',
                label: article.isArchived ? 'Restore from Archive' : 'Archive Article',
                icon: faArchive,
                section: 'Article Actions',
                action: () => handleArchive()
            },
            {
                id: 'article-collection',
                label: 'Add to Collection...',
                icon: faFolderPlus,
                section: 'Article Actions',
                action: () => setShowCollectionSelector(true)
            },
            {
                id: 'article-delete',
                label: 'Delete Article',
                icon: faTrash,
                section: 'Article Actions',
                action: () => setShowDeleteConfirm(true)
            },
            {
                id: 'article-offline',
                label: isAvailableOffline ? 'Remove Offline Copy' : 'Save for Offline',
                icon: isAvailableOffline ? faCloud : faCloudArrowDown,
                section: 'Article Actions',
                action: () => handleToggleOffline()
            },
            {
                id: 'article-open-original',
                label: 'Open Original URL',
                icon: faRotateRight,
                section: 'Article Actions',
                action: () => { if (article.url) window.open(article.url, '_blank'); }
            },

            // --- AI Features ---
            {
                id: 'ai-summarize',
                label: article.summary ? 'Show / Hide Summary' : 'Generate AI Summary',
                icon: faStarHalfStroke,
                section: 'AI Features',
                action: () => handleSummarize()
            },
            {
                id: 'ai-podcast',
                label: showPodcastPlayer ? 'Hide Podcast Player' : 'Open Podcast Player',
                icon: faPodcast,
                section: 'AI Features',
                action: () => setShowPodcastPlayer(!showPodcastPlayer)
            },
            {
                id: 'ai-audio',
                label: showAudioPlayer ? 'Hide Audio Reader' : 'Open Audio Reader',
                icon: faHeadphones,
                section: 'AI Features',
                action: () => setShowAudioPlayer(!showAudioPlayer)
            },
            {
                id: 'ai-chat',
                label: isChatMode ? 'Close Article Chat' : 'Chat About Article',
                icon: faComments,
                section: 'AI Features',
                action: () => setIsChatMode(!isChatMode)
            },

            // --- Translation ---
            {
                id: 'article-translate',
                label: currentLanguage !== 'original' ? `Restore Original Language` : 'Translate Article...',
                icon: faLanguage,
                section: 'Translation',
                action: () => {
                    if (currentLanguage !== 'original') {
                        handleRestoreOriginal();
                    } else {
                        setShowTranslateDropdown(!showTranslateDropdown);
                    }
                }
            },
        ];

        cmds.filter(command => !article?.isPastedText || ![
            'article-collection', 'article-open-original', 'ai-podcast', 'ai-audio', 'ai-chat', 'article-translate'
        ].includes(command.id)).forEach(registerCommand);
        return () => { cmds.forEach(cmd => unregisterCommand(cmd.id)); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        article?.isBookmarked, article?.isLiked, article?.isArchived,
        article?.summary, article?.url, articleId,
        isAvailableOffline, showPodcastPlayer, showAudioPlayer,
        isChatMode, showSummary, currentLanguage, showTranslateDropdown,
        registerCommand, unregisterCommand
    ]);

    const handleFavorite = async () => {
        if (!articleId || !article) return;

        setIsBookmarkAnimating(true);
        setTimeout(() => setIsBookmarkAnimating(false), 600);

        try {
            const token = await getToken();
            const response = await fetch(apiUrl(`/articles/${articleId}/bookmark`), {
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

    const handleLike = async () => {
        if (!articleId || !article) return;

        setIsLikeAnimating(true);
        setTimeout(() => setIsLikeAnimating(false), 600);

        try {
            const token = await getToken();
            const response = await fetch(apiUrl(`/articles/${articleId}/like`), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to like article');
            }
            setArticle(prev => prev ? { ...prev, isLiked: !prev.isLiked } : null);
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
            const params = new URLSearchParams();
            if (detectedLanguage) params.append('language', detectedLanguage);
            if (adminAccess?.canSelectAiProvider && summaryProvider !== 'default') params.append('provider', summaryProvider);
            const qs = params.toString();
            const url = apiUrl(`/articles/${articleId}/summarize${qs ? `?${qs}` : ''}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate summary');
            }

            const data = await response.json() as SummaryResponse;
            setArticle(prev => prev ? { ...prev, summary: data.summary, summaryStatus: data.status, summaryLanguage: detectedLanguage || 'en' } : null);
            // Store metadata about the summary generation
            setSummaryMetadata({
                model: data.model,
                fallbackUsed: data.fallbackUsed,
                status: data.status
            });
            showSummaryCreditWarning(data.softCapWarning);
            setShowSummary(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate summary');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleRefreshSummary = async (languageCode?: string) => {
        if (!articleId || !article) return;

        // Use provided language, or fall back to current summary language, detected language, or default to English
        const targetLangCode = languageCode || article.summaryLanguage || detectedLanguage || 'en';

        setIsGeneratingSummary(true);

        try {
            const token = await getToken();
            // Build query params
            const params = new URLSearchParams({ force: 'true' });
            if (adminAccess?.canSelectAiProvider && summaryProvider !== 'default') params.append('provider', summaryProvider);

            // Send the ISO code (e.g., 'es') directly to the backend
            if (targetLangCode) params.append('language', targetLangCode);

            const url = apiUrl(`/articles/${articleId}/summarize?${params.toString()}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate summary');
            }

            const data = await response.json() as SummaryResponse;
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
            showSummaryCreditWarning(data.softCapWarning);
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
            const response = await fetch(apiUrl(`/articles/${articleId}/summary`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete summary');
            }

            // Update local state
            setArticle(prev => prev ? { ...prev, summary: undefined, summaryStatus: 'idle' } : null);
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
            const response = await fetch(apiUrl(`/articles/${articleId}/archive`), {
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
            const response = await fetch(apiUrl(`/articles/${articleId}`), {
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
        <div className={`article-reader theme-${readingTheme}`}>
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
                    className={`action-icon-btn button-favorite ${article.isBookmarked ? 'bookmarked' : ''}`}
                    whileTap={{ scale: 0.95 }}
                    animate={isBookmarkAnimating ? {
                        scale: [1, 1.1, 1],
                        rotateZ: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.3 }}
                    title={article.isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <FontAwesomeIcon icon={article.isBookmarked ? faBookmarkSolid : faBookmarkRegular} />
                </motion.button>

                <motion.button
                    onClick={handleLike}
                    className={`action-icon-btn button-like ${article.isLiked ? 'liked' : ''}`}
                    whileTap={{ scale: 0.95 }}
                    animate={isLikeAnimating ? {
                        scale: [1, 1.3, 1],
                        rotateZ: [0, -10, 10, 0]
                    } : {}}
                    transition={{ duration: 0.3 }}
                    title={article.isLiked ? 'Remove like' : 'Like — boosts similar recommendations'}
                >
                    <FontAwesomeIcon icon={article.isLiked ? faHeartSolid : faHeartRegular} />
                </motion.button>

                <button
                    onClick={handleSummarize}
                    className={`action-icon-btn button-summarize ${article.summary ? 'has-summary' : ''} ${isGeneratingSummary ? 'loading' : ''} ${article.hasContent === false ? 'disabled' : ''}`}
                    disabled={isGeneratingSummary || article.hasContent === false}
                    title={article.hasContent === false ? 'Summary unavailable for paywalled content' :
                        isGeneratingSummary ? 'Generating summary...' :
                            (article.summary || article.summaryStatus === 'pending') ? (showSummary ? 'Hide summary' : 'Show summary') :
                                'Generate AI summary'}
                >
                    <FontAwesomeIcon icon={faStarHalfStroke} />
                    {article.summary && article.summaryStatus !== 'pending' && <span className="ready-dot" />}
                </button>

                {!article.isPastedText && <button
                    onClick={() => setShowPodcastPlayer(!showPodcastPlayer)}
                    className={`action-icon-btn button-podcast ${showPodcastPlayer ? 'active' : ''} ${article.hasContent === false ? 'disabled' : ''}`}
                    disabled={article.hasContent === false}
                    title={article.hasContent === false ? 'Audio unavailable for paywalled content' : (showPodcastPlayer ? 'Hide podcast' : 'Podcast')}
                >
                    <FontAwesomeIcon icon={faPodcast} />
                    {article.audioLocation && <span className="ready-dot" />}
                </button>}

                {!article.isPastedText && <button
                    onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                    className={`action-icon-btn button-audio ${showAudioPlayer ? 'active' : ''} ${article.narrationLocation ? 'has-narration' : ''} ${article.hasContent === false ? 'disabled' : ''}`}
                    disabled={article.hasContent === false}
                    title={article.hasContent === false ? 'Audio unavailable for paywalled content' : (showAudioPlayer ? 'Hide reader' : 'Read aloud')}
                >
                    <FontAwesomeIcon icon={faHeadphones} />
                    {article.narrationLocation && <span className="ready-dot" />}
                </button>}

                {!article.isPastedText && <button
                    onClick={() => setIsChatMode(!isChatMode)}
                    className={`action-icon-btn button-chat ${isChatMode ? 'active' : ''} ${article.hasContent === false ? 'disabled' : ''}`}
                    disabled={article.hasContent === false || !userHasProAccess}
                    title={!userHasProAccess ? 'Chat is a Pro feature' : article.hasContent === false ? 'Chat unavailable for paywalled content' : (isChatMode ? 'Close chat' : 'Chat with article')}
                >
                    <FontAwesomeIcon icon={faComments} />
                    {userHasProAccess && <span className="pro-badge-dot" />}
                </button>}

                {/* Translation Dropdown */}
                {!article.isPastedText && <div className="action-dropdown-container">
                    <button
                        className={`action-icon-btn button-translate ${currentLanguage !== 'original' ? 'active' : ''}`}
                        onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                        disabled={isTranslating}
                        title={isTranslating ? 'Translating...' : 'Translate article'}
                    >
                        {isTranslating ? (
                            <FontAwesomeIcon icon={faRotateRight} spin />
                        ) : currentLanguage !== 'original' ? (
                            <span className="flag-icon">
                                {LANGUAGES.find(l => l.code === currentLanguage)?.flag}
                            </span>
                        ) : (
                            <FontAwesomeIcon icon={faLanguage} />
                        )}
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
                </div>}

                <div className="actions-dropdown">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="action-icon-btn dropdown-toggle"
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
                                {!article.isPastedText && <button
                                    onClick={() => handleDropdownAction(handleToggleOffline)}
                                    className={`dropdown-item offline-item ${isAvailableOffline ? 'active' : ''}`}
                                    disabled={isSavingOffline}
                                >
                                    <FontAwesomeIcon icon={isSavingOffline ? faRotateRight : isAvailableOffline ? faCloud : faCloudArrowDown} spin={isSavingOffline} />
                                    <span>{isAvailableOffline ? 'Remove offline copy' : 'Save for offline'}</span>
                                </button>}

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

            {article.userArticleId && <TagsManager userArticleId={article.userArticleId} articleTitle={article.title} articleContent={displayContent} />}

            <div className="article-header">
                <h1>{article.title}</h1>
                <div className="article-meta">
                    <div className="article-author">{article.isPastedText ? 'Pasted text' : `By ${article.author || 'Unknown author'}`}</div>
                    {article.publishDate && <div className="article-date">Published on: {new Date(article.publishDate).toLocaleDateString()}</div>}
                    {estimatedReadingTime > 0 && (
                        <div className="reading-time">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{estimatedReadingTime} min read</span>
                        </div>
                    )}
                </div>
                {adminAccess?.canSelectAiProvider && (
                    <fieldset className="admin-summary-provider">
                        <legend>Summary provider</legend>
                        <div className="admin-summary-provider__options">
                            {([['default', 'Automatic'], ['gemini', 'Gemini'], ['openai-compatible', 'OpenAI']] as const).map(([value, label]) => (
                                <label key={value}>
                                    <input
                                        type="radio"
                                        name="summaryProvider"
                                        value={value}
                                        checked={summaryProvider === value}
                                        onChange={() => setSummaryProvider(value)}
                                        disabled={isGeneratingSummary}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                )}
            </div>


            <ArticleSummaryPanel
                article={article}
                isOpen={showSummary}
                isGeneratingSummary={isGeneratingSummary}
                detectedLanguage={detectedLanguage}
                summaryMetadata={summaryMetadata}
                onRefresh={(language) => { void handleRefreshSummary(language); }}
                onDelete={handleDeleteSummary}
                onClose={() => setShowSummary(false)}
            />

            {/* AI Podcast Player */}
            <AnimatePresence>
                {!article.isPastedText && article.content && articleId && showPodcastPlayer && (
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
                            savedAudioUrl={article.audioLocation}
                            className="article-podcast-player"
                            onClose={() => setShowPodcastPlayer(false)}
                            selectedLanguage={detectedLanguage ?? undefined}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Standard TTS Player */}
            <AnimatePresence>
                {!article.isPastedText && articleId && showAudioPlayer && (
                    <motion.div
                        className="article-audio-section"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <ArticleAudioPlayer
                            articleId={articleId}
                            content={article.content || ''}
                            className="article-audio-player"
                            audioLocation={article.narrationLocation}
                            onClose={() => setShowAudioPlayer(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Related Articles from User's Library */}
            {articleId && !article.isUrlOnly && !article.isPastedText && (
                <RelatedArticles articleId={articleId} />
            )}

            {!article.isPastedText && article.url && <div className="article-source">
                <p>This content is republished from <a href={article.url} target="_blank" rel="noopener noreferrer">the original source</a> for personal use. All rights belong to the original author and publisher.</p>
            </div>}
            <hr />
            <div
                ref={contentRef}
                className="article-content"
                style={{ fontFamily: currentFontOption.cssFamily }}
                dangerouslySetInnerHTML={{ __html: displayContent }}
            />

            {articleId && !article.isPastedText && (
                <SelectionToolbar articleId={articleId} contentRef={contentRef} />
            )}

            {!article.isPastedText && <CollectionSelector
                isOpen={showCollectionSelector}
                onClose={() => setShowCollectionSelector(false)}
                articleId={article.id ?? ''}
            />}

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

            {/* Right-side Chat Panel */}
            {!article.isPastedText && <ArticleChat
                articleId={articleId!}
                isOpen={isChatMode}
                onClose={() => setIsChatMode(false)}
                userHasProAccess={userHasProAccess}
                articleTitle={article?.title}
                articleSummary={article?.summary}
            />}
        </div>
    );
};

export default ArticleReader;
