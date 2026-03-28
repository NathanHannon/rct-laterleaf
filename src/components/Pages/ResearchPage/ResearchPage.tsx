import { useState, useRef } from 'react';
import { useAuth } from "@clerk/react";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faAtom, faArrowRight, faCopy, faDownload, faFileLines, faCheck, faArrowUpRightFromSquare, faLock } from '@fortawesome/free-solid-svg-icons';
import { useUserStatus } from '../../../hooks/useUserStatus';
import './ResearchPage.scss';

interface ResearchResult {
    report: string;
    articleCount: number;
    articleIds: string[];
    sources: { id: string; title: string; url: string }[];
}

const EXAMPLE_QUESTIONS = [
    'What are the common themes across my saved AI articles?',
    'Summarize what I\'ve read about climate policy',
    'How do my saved articles compare on remote work productivity?',
    'What design patterns keep coming up in my reading?',
];

const ResearchPage = () => {
    const { getToken } = useAuth();
    const { isPro, isLoading: isStatusLoading } = useUserStatus();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<ResearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (questionOverride?: string) => {
        const q = questionOverride || query;
        if (!q.trim() || q.trim().length < 3) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const token = await getToken();
            const response = await fetch('/api/articles/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ query: q.trim() }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error?.message || 'Failed to generate research report');
            }

            const data: ResearchResult = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleExampleClick = (question: string) => {
        setQuery(question);
        handleSubmit(question);
    };

    const handleCopy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(enrichReportWithLinks(result.report, result.sources));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadMd = () => {
        if (!result) return;
        const filename = `research-${query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.md`;
        downloadFile(enrichReportWithLinks(result.report, result.sources), filename, 'text/markdown');
    };

    const handleDownloadTxt = () => {
        if (!result) return;
        const plain = result.report
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        const filename = `research-${query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
        downloadFile(plain, filename, 'text/plain');
    };

    // Post-process the report to turn [N] references into clickable links
    const enrichReportWithLinks = (report: string, sources?: ResearchResult['sources']): string => {
        if (!sources?.length) return report;

        // Turn [N] inline citations into linked numbers pointing to the source URL
        return report.replace(
            /\[(\d+)\]/g,
            (match, num) => {
                const index = parseInt(num, 10) - 1;
                const source = sources[index];
                if (source?.url) {
                    return `[[${num}]](${source.url})`;
                }
                return match;
            }
        );
    };

    if (isStatusLoading) {
        return (
            <div className="research-page">
                <div className="research-header">
                    <div className="research-header-icon">
                        <FontAwesomeIcon icon={faAtom} />
                    </div>
                    <h1>Research</h1>
                </div>
            </div>
        );
    }

    if (!isPro) {
        return (
            <div className="research-page">
                <div className="research-header">
                    <div className="research-header-icon">
                        <FontAwesomeIcon icon={faAtom} />
                    </div>
                    <h1>Research</h1>
                    <p>Your private research assistant that synthesizes your saved articles into cohesive briefs.</p>
                </div>
                <div className="research-pro-gate">
                    <FontAwesomeIcon icon={faLock} className="pro-gate-icon" />
                    <h2>Pro Feature</h2>
                    <p>Research is available exclusively to Pro subscribers. Instantly synthesize months of reading into a single, cohesive report.</p>
                    <Link to="/settings" className="pro-gate-cta">Upgrade to Pro</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="research-page">
            <div className="research-header">
                <div className="research-header-icon">
                    <FontAwesomeIcon icon={faAtom} />
                </div>
                <h1>Research</h1>
                <p>Ask a question and get a synthesized report from your saved articles.</p>
            </div>

            <div className="research-input-area">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="research-textarea-wrapper">
                        <textarea
                            ref={textareaRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about your library..."
                            rows={3}
                            maxLength={500}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || query.trim().length < 3}
                            className="research-submit-btn"
                        >
                            {isLoading ? (
                                <div className="submit-spinner" />
                            ) : (
                                <FontAwesomeIcon icon={faPaperPlane} />
                            )}
                        </button>
                    </div>
                    <div className="research-input-hint">
                        <span>{query.length}/500</span>
                        <span>Press Enter to submit</span>
                    </div>
                </form>
            </div>

            {/* Example Questions */}
            <AnimatePresence>
                {!result && !isLoading && !error && (
                    <motion.div
                        className="research-examples"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <span className="examples-label">Try asking</span>
                        <div className="examples-grid">
                            {EXAMPLE_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    className="example-chip"
                                    onClick={() => handleExampleClick(q)}
                                >
                                    <span>{q}</span>
                                    <FontAwesomeIcon icon={faArrowRight} className="chip-arrow" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading State */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="research-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="loading-pulse" />
                        <p>Searching your library and synthesizing a report...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error State */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        className="research-error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <p>{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        className="research-result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="result-meta">
                            <span>Synthesized from {result.articleCount} article{result.articleCount !== 1 ? 's' : ''}</span>
                            <div className="result-export-actions">
                                <button onClick={handleCopy} className="export-btn" title="Copy markdown">
                                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                                    <span>{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button onClick={handleDownloadMd} className="export-btn" title="Download as Markdown">
                                    <FontAwesomeIcon icon={faDownload} />
                                    <span>.md</span>
                                </button>
                                <button onClick={handleDownloadTxt} className="export-btn" title="Download as plain text">
                                    <FontAwesomeIcon icon={faFileLines} />
                                    <span>.txt</span>
                                </button>
                            </div>
                        </div>
                        <div className="result-report">
                            <ReactMarkdown
                                components={{
                                    a: ({ href, children, ...props }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                            {children}
                                        </a>
                                    ),
                                }}
                            >
                                {enrichReportWithLinks(result.report, result.sources)}
                            </ReactMarkdown>
                        </div>
                        {(result.sources?.length ?? 0) > 0 && (
                            <div className="result-sources">
                                <h4>Source Articles</h4>
                                <div className="source-links">
                                    {result.sources.map((source) => (
                                        <Link
                                            key={source.id}
                                            to={`/article/${source.id}`}
                                            className="source-chip"
                                        >
                                            <span className="chip-title">{source.title}</span>
                                            {source.url && <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="chip-ext" />}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResearchPage;
