import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage, faCheck, faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { LANGUAGES } from '../../../constants/languages';
import type { Article } from '../../../interfaces/article';

interface ArticleSummaryPanelProps {
    article: Article;
    isOpen: boolean;
    isGeneratingSummary: boolean;
    detectedLanguage: string | null;
    summaryMetadata: { fallbackUsed?: boolean };
    onRefresh: (language?: string) => void;
    onDelete: () => void;
    onClose: () => void;
}

export default function ArticleSummaryPanel({ article, isOpen, isGeneratingSummary, detectedLanguage, summaryMetadata, onRefresh, onDelete, onClose }: ArticleSummaryPanelProps) {
    const [showSummaryLangDropdown, setShowSummaryLangDropdown] = useState(false);
    const getLanguageName = (code: string) => LANGUAGES.find(language => language.code === code)?.name || 'English';
    return (
        <div className="ai-summary-tray">
            <AnimatePresence>
                {isOpen && (article.summary || article.summaryStatus === 'pending') && (
                    <motion.div
                        className="ai-summary-panel"
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <div className="summary-header">
                            <div className="summary-header-top">
                                <div className="summary-title">
                                    <h3>✨ AI Summary</h3>
                                    <div className="summary-subtitle">
                                        <small>AI-generated • Not editorial judgment</small>
                                        {article.summaryStatus === 'pending' && (
                                            <span className="status-badge pending">
                                                ⏳ Processing
                                            </span>
                                        )}
                                        {summaryMetadata.fallbackUsed && article.summaryStatus === 'completed' && (
                                            <span className="status-badge fallback" title="Primary AI model was busy, used backup model">
                                                🔄 Backup model
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="close-panel-button"
                                    onClick={() => onClose()}
                                    title="Close Summary"
                                    aria-label="Close summary"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="summary-actions">
                                {/* Summary Language Selector */}
                                <div className="summary-language-selector">
                                    <button
                                        onClick={() => setShowSummaryLangDropdown(!showSummaryLangDropdown)}
                                        className="summary-language-btn"
                                        title="Change summary language"
                                        aria-expanded={showSummaryLangDropdown}
                                        disabled={isGeneratingSummary}
                                    >
                                        <FontAwesomeIcon icon={faLanguage} />
                                        <span>{getLanguageName(article.summaryLanguage || detectedLanguage || 'en')}</span>
                                    </button>
                                    {showSummaryLangDropdown && (
                                        <div className="summary-lang-dropdown">
                                            {LANGUAGES.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => { setShowSummaryLangDropdown(false); onRefresh(lang.code); }}
                                                    className={article.summaryLanguage === lang.code ? 'active' : ''}
                                                >
                                                    <span className="flag">{lang.flag}</span>
                                                    <span className="name">{lang.name}</span>
                                                    {article.summaryLanguage === lang.code && <FontAwesomeIcon icon={faCheck} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="summary-icon-actions">
                                    <button
                                        onClick={() => onRefresh()}
                                        className="refresh-summary-button"
                                        disabled={isGeneratingSummary}
                                        title="Regenerate summary"
                                        aria-label="Regenerate summary"
                                    >
                                        <FontAwesomeIcon
                                            icon={faRotateRight}
                                            className={isGeneratingSummary ? 'spinning' : ''}
                                        />
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className="delete-summary-button"
                                        title="Delete summary"
                                        aria-label="Delete summary"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
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
                                <ReactMarkdown>{article.summary}</ReactMarkdown>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
