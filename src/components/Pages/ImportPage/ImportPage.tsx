import { useState, useRef } from 'react';
import { useAuth } from '@clerk/react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileImport,
    faCloudArrowUp,
    faSpinner,
    faCheck,
    faXmark,
    faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import './ImportPage.scss';

interface ParsedBookmark {
    url: string;
    title?: string;
    tags?: string[];
    dateAdded?: string;
}

type ImportStatus = 'idle' | 'parsing' | 'parsed' | 'importing';

interface ImportResult {
    url: string;
    title?: string;
    status: 'pending' | 'success' | 'error';
    message?: string;
}

const ImportPage = () => {
    const { getToken } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [status, setStatus] = useState<ImportStatus>('idle');
    const [source, setSource] = useState('');
    const [bookmarks, setBookmarks] = useState<ParsedBookmark[]>([]);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

    const detectFormat = (filename: string, content: string): 'html' | 'csv' | 'json' => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'csv') return 'csv';
        if (ext === 'json') return 'json';
        if (ext === 'html' || ext === 'htm') return 'html';
        // Try to detect from content
        const trimmed = content.trimStart();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
        if (trimmed.startsWith('<!') || trimmed.startsWith('<')) return 'html';
        return 'csv';
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setStatus('parsing');
        setResults([]);

        try {
            const content = await file.text();
            const format = detectFormat(file.name, content);

            const token = await getToken();
            const res = await fetch('/api/import/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content, format }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: { message: res.statusText } }));
                throw new Error(errData.error?.message || 'Failed to parse file');
            }

            const data = await res.json();
            setBookmarks(data.bookmarks);
            setSource(data.source);
            setStatus('parsed');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
            setStatus('idle');
        }

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleStartImport = async () => {
        setStatus('importing');
        setImportProgress({ done: 0, total: bookmarks.length });
        setResults(bookmarks.map(b => ({
            url: b.url,
            title: b.title,
            status: 'pending',
        })));

        const token = await getToken();

        for (let i = 0; i < bookmarks.length; i++) {
            const bookmark = bookmarks[i];
            try {
                const res = await fetch('/api/articles/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ url: bookmark.url }),
                });

                if (res.ok) {
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? { ...r, status: 'success' } : r
                    ));
                } else {
                    const errData = await res.json().catch(() => ({ error: { message: 'Import failed' } }));
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? { ...r, status: 'error', message: errData.error?.message || 'Failed' } : r
                    ));
                }
            } catch {
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? { ...r, status: 'error', message: 'Network error' } : r
                ));
            }

            setImportProgress({ done: i + 1, total: bookmarks.length });

            // Rate limit: small delay between imports
            if (i < bookmarks.length - 1) {
                await new Promise(r => setTimeout(r, 800));
            }
        }
    };

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return (
        <div className="import-page">
            <div className="page-container">
                <motion.header
                    className="premium-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                >
                    <div className="header-eyebrow">Data & Portability</div>
                    <h1 className="header-title">Import Articles</h1>
                    <p className="header-subtitle">
                        Bring your saved articles from Pocket, Instapaper, browser bookmarks, or any other service
                    </p>
                    <div className="header-mesh"></div>
                </motion.header>

                {/* Upload section */}
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div
                            key="upload"
                            className="upload-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FontAwesomeIcon icon={faCloudArrowUp} className="upload-icon" />
                                <p className="upload-title">Drop your export file or click to browse</p>
                                <p className="upload-formats">Supports HTML, CSV, and JSON exports</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".html,.htm,.csv,.json"
                                    onChange={handleFileUpload}
                                    hidden
                                />
                            </div>

                            <div className="source-cards">
                                <div className="source-card">
                                    <h3>Pocket</h3>
                                    <p>Export from <a href="https://getpocket.com/export" target="_blank" rel="noopener noreferrer">getpocket.com/export</a> as HTML</p>
                                </div>
                                <div className="source-card">
                                    <h3>Instapaper</h3>
                                    <p>Settings → Export → Download CSV</p>
                                </div>
                                <div className="source-card">
                                    <h3>Browser</h3>
                                    <p>Export bookmarks as HTML from Chrome, Firefox, or Safari</p>
                                </div>
                                <div className="source-card">
                                    <h3>Other</h3>
                                    <p>Any CSV with a URL column, or JSON array with url fields</p>
                                </div>
                            </div>

                            {error && (
                                <div className="error-banner">
                                    <FontAwesomeIcon icon={faCircleExclamation} />
                                    {error}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {status === 'parsing' && (
                        <motion.div
                            key="parsing"
                            className="parsing-section"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <FontAwesomeIcon icon={faSpinner} spin className="parsing-spinner" />
                            <p>Parsing your export file...</p>
                        </motion.div>
                    )}

                    {status === 'parsed' && (
                        <motion.div
                            key="parsed"
                            className="parsed-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="parsed-summary">
                                <FontAwesomeIcon icon={faFileImport} className="summary-icon" />
                                <div>
                                    <h2>Found {bookmarks.length} articles from {source}</h2>
                                    <p>These will be imported into your library using the standard pipeline (content extraction, deduplication, and AI processing).</p>
                                </div>
                            </div>

                            <div className="bookmark-preview">
                                {bookmarks.slice(0, 10).map((b, i) => (
                                    <div key={i} className="bookmark-row">
                                        <span className="bookmark-title">{b.title || b.url}</span>
                                        <span className="bookmark-url">{new URL(b.url).hostname}</span>
                                    </div>
                                ))}
                                {bookmarks.length > 10 && (
                                    <div className="bookmark-more">
                                        +{bookmarks.length - 10} more articles
                                    </div>
                                )}
                            </div>

                            <div className="parsed-actions">
                                <button className="btn-secondary" onClick={() => { setStatus('idle'); setBookmarks([]); }}>
                                    Cancel
                                </button>
                                <button className="btn-primary" onClick={handleStartImport}>
                                    <FontAwesomeIcon icon={faFileImport} />
                                    Import {bookmarks.length} Articles
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === 'importing' && (
                        <motion.div
                            key="importing"
                            className="importing-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="progress-header">
                                <h2>Importing articles...</h2>
                                <span className="progress-count">
                                    {importProgress.done} / {importProgress.total}
                                </span>
                            </div>

                            <div className="progress-bar-track">
                                <motion.div
                                    className="progress-bar-fill"
                                    animate={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {importProgress.done === importProgress.total && (
                                <div className="import-complete">
                                    <h3>Import Complete</h3>
                                    <p>
                                        <strong>{successCount}</strong> imported successfully
                                        {errorCount > 0 && <>, <strong>{errorCount}</strong> failed</>}
                                    </p>
                                    <button className="btn-primary" onClick={() => { setStatus('idle'); setBookmarks([]); setResults([]); }}>
                                        Import More
                                    </button>
                                </div>
                            )}

                            <div className="results-list">
                                {results.map((r, i) => (
                                    <div key={i} className={`result-row ${r.status}`}>
                                        <span className="result-icon">
                                            {r.status === 'pending' && <FontAwesomeIcon icon={faSpinner} spin />}
                                            {r.status === 'success' && <FontAwesomeIcon icon={faCheck} />}
                                            {r.status === 'error' && <FontAwesomeIcon icon={faXmark} />}
                                        </span>
                                        <span className="result-title">{r.title || r.url}</span>
                                        {r.message && <span className="result-message">{r.message}</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ImportPage;
