import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import type { Article } from '../../../interfaces/article';
import CollectionSelector from '../../Collections/CollectionSelector/CollectionSelector';
import ConfirmationDialog from '../../Common/ConfirmationDialog/ConfirmationDialog';
import TagsManager from '../../TagsManager/TagsManager';
import './ArticleReader.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid, faArchive, faTrash, faMagicWandSparkles, faRotateRight, faFolderPlus, faEllipsisV, faGem } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
import { hasProAccess } from '../../../utils/tierUtils';

const ArticleReader = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const { getToken } = useAuth();
    const { user } = useUser();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
    const [isChatMode, setIsChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string, timestamp?: string }[]>([]);
    const [isGeneratingChat, setIsGeneratingChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [showCollectionSelector, setShowCollectionSelector] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [useProSummary, setUseProSummary] = useState(false); // State for Pro summary toggle
    const [summaryMetadata, setSummaryMetadata] = useState<{
        model?: string;
        fallbackUsed?: boolean;
        status?: 'completed' | 'pending';
    }>({});

    // Check if user has pro access for chat functionality
    const userHasProAccess = hasProAccess(user);

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
        if (article.summary) {
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
            setArticle(prev => prev ? { ...prev, summary: data.summary } : null);
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

    const handleRefreshSummary = async () => {
        if (!articleId || !article) return;

        setIsGeneratingSummary(true);
        try {
            const token = await getToken();
            const url = `/api/articles/${articleId}/summarize?force=true${useProSummary && !userHasProAccess ? '&usePro=true' : ''}`;
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
            setArticle(prev => prev ? { ...prev, summary: data.summary } : null);
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

    // const handleStartChat = async () => {
    //     if (!article?.summary) return;

    //     // Check if user has pro access for chat functionality
    //     if (!userHasProAccess) {
    //         alert('Chat functionality is available for Pro users only. Please upgrade to access this feature.');
    //         return;
    //     }

    //     try {
    //         // Load existing chat history from database
    //         const token = await getToken();
    //         const response = await fetch(`/api/articles/${articleId}/chat`, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });

    //         if (response.ok) {
    //             const data = await response.json();
    //             setChatMessages(data.chatHistory || []);
    //         } else {
    //             // If no history exists, start with summary context
    //             setChatMessages([
    //                 {
    //                     role: 'assistant',
    //                     content: `I've analyzed this article about "${article.title}". Here's my summary:\n\n${article.summary}\n\nWhat would you like to discuss about this article?`,
    //                     timestamp: new Date().toISOString()
    //                 }
    //             ]);
    //         }
    //     } catch {
    //         // Fallback to summary context if loading fails
    //         setChatMessages([
    //             {
    //                 role: 'assistant',
    //                 content: `I've analyzed this article about "${article.title}". Here's my summary:\n\n${article.summary}\n\nWhat would you like to discuss about this article?`,
    //                 timestamp: new Date().toISOString()
    //             }
    //         ]);
    //     }

    //     setIsChatMode(true);
    // };

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

    useEffect(() => {
        const fetchArticle = async () => {
            if (!articleId) return;

            try {
                setLoading(true);
                const token = await getToken();
                const response = await fetch(`/api/articles/${articleId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data: Article = await response.json();
                // console.log('ArticleReader received data:', {
                //     articleId: data.id,
                //     title: data.title,
                //     isBookmarked: data.isBookmarked,
                //     isArchived: data.isArchived
                // });
                setArticle(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [articleId, getToken]);

    // The useEffect hook for auto-showing the summary has been removed.
    // The summary will now only appear when the user clicks the "Show Summary" button.

    if (loading) {
        return <div>Loading article...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!article) {
        return <div>Article not found.</div>;
    }

    return (
        <div className="article-reader">
            <div className="article-actions">
                <motion.button
                    onClick={handleFavorite}
                    className={`button-favorite ${article.isBookmarked ? 'favorited' : ''}`}
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
                    className={`button-summarize ${article.summary ? 'has-summary' : ''} ${isGeneratingSummary ? 'loading' : ''}`}
                    disabled={isGeneratingSummary}
                >
                    <FontAwesomeIcon icon={faMagicWandSparkles} />
                    <span>
                        {isGeneratingSummary ? 'Generating...' :
                            article.summary ? (showSummary ? 'Hide Summary' : 'Show Summary') :
                                'Summarize'}
                    </span>
                </button>

                {/* Pro Summary Toggle for Free Users */}
                {!userHasProAccess && !article.summary && (
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
                                disabled={isGeneratingSummary}
                            />
                            <span className="slider round"></span>
                        </label>
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

            <h1>{article.title}</h1>
            <div className="article-author">By {article.author || 'Unknown author'}</div>
            {article.publishedAt && <div className="article-date">Published on: {new Date(article.publishedAt).toLocaleDateString()}</div>}

            {/* AI Summary Panel */}
            <AnimatePresence>
                {showSummary && article.summary && (
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
                                    {summaryMetadata.status === 'pending' && (
                                        <span className="status-badge pending">
                                            ⏳ Processing in background
                                        </span>
                                    )}
                                    {summaryMetadata.fallbackUsed && summaryMetadata.status === 'completed' && (
                                        <span className="status-badge fallback" title="Primary AI model was busy, used backup model">
                                            🔄 Backup model used
                                        </span>
                                    )}
                                    {summaryMetadata.model && !summaryMetadata.fallbackUsed && (
                                        <span className="status-badge success" title={`Generated using ${summaryMetadata.model}`}>
                                            ✅ {summaryMetadata.model?.includes('2.5-pro') ? 'Pro model' : 'Standard model'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="summary-actions">
                                {!isChatMode && (
                                    <>
                                        {/* <button
                                            onClick={handleStartChat}
                                            className={`converse-button ${!userHasProAccess ? 'pro-only' : ''}`}
                                            title={userHasProAccess ? "Discuss this article" : "Chat is available for Pro users only"}
                                            disabled={!userHasProAccess}
                                        >
                                            <FontAwesomeIcon icon={faComments} />
                                            {!userHasProAccess && <span className="pro-badge">PRO</span>}
                                        </button> */}
                                        <button
                                            onClick={handleRefreshSummary}
                                            className="refresh-summary-button"
                                            disabled={isGeneratingSummary}
                                            title="Regenerate summary"
                                        >
                                            <FontAwesomeIcon
                                                icon={faRotateRight}
                                                className={isGeneratingSummary ? 'spinning' : ''}
                                            />
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
                        {/* <ArticleAudioPlayer articleId={article.id ?? ''} hasContent={!!article.content} /> */}
                        <div className="summary-content">
                            {/* Show pending message if status is pending */}
                            {summaryMetadata.status === 'pending' ? (
                                <div className="pending-summary">
                                    <div className="pending-animation">
                                        <div className="spinner"></div>
                                    </div>
                                    <p>Your summary is being generated in the background. Please check back in a few minutes.</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="refresh-page-button"
                                    >
                                        Refresh to check status
                                    </button>
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

            <div className="article-source">
                <p>This content is republished from <a href={article.url} target="_blank" rel="noopener noreferrer">the original source</a> for personal use. All rights belong to the original author and publisher.</p>
            </div>
            <hr />
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content || '' }}></div>

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

            {/* The audio player is now independent of the summary */}
            {/* <ArticleAudioPlayer articleId={article.id ?? ''} hasContent={!!article.content} /> */}
        </div>
    );
};

export default ArticleReader;
