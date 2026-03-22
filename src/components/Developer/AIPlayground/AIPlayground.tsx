import { useState, useEffect } from 'react';
import {
    type ChromeAIStatus,
    getAllAIStatus,
    getTranslatorStatus,
    suggestTagsForArticle,
    summarizeArticle,
    detectLanguage,
    translateText,
} from '../../../services/nanoAiService';
import { LANGUAGES } from '../../../constants/languages';
import './AIPlayground.scss';

const SAMPLE_TEXT = `Artificial intelligence has rapidly transformed how we interact with technology. From virtual assistants to recommendation engines, AI systems now power many of the tools we use daily. Recent advances in large language models have opened new possibilities for creative writing, code generation, and scientific research, while also raising important questions about safety, bias, and the future of work.`;

const statusClass = (s: ChromeAIStatus) => {
    if (s === 'available') return 'ready';
    if (s === 'downloadable' || s === 'downloading') return 'pending';
    return 'unavailable';
};

const statusText = (s: ChromeAIStatus) => {
    switch (s) {
        case 'available': return 'Ready';
        case 'downloadable': return 'Downloadable';
        case 'downloading': return 'Downloading…';
        case 'unavailable': return 'Unavailable';
        default: return 'Unsupported';
    }
};

const AIPlayground = () => {
    // ── API statuses ─────────────────────────
    const [statuses, setStatuses] = useState<{
        prompt: ChromeAIStatus;
        summarizer: ChromeAIStatus;
        languageDetector: ChromeAIStatus;
    }>({ prompt: 'unsupported', summarizer: 'unsupported', languageDetector: 'unsupported' });
    const [translatorStatus, setTranslatorStatus] = useState<ChromeAIStatus>('unsupported');

    useEffect(() => {
        getAllAIStatus().then(setStatuses);
        getTranslatorStatus('en', 'es').then(setTranslatorStatus);
    }, []);

    // ── Prompt (tags) ────────────────────────
    const [tagInput, setTagInput] = useState(SAMPLE_TEXT);
    const [tagResult, setTagResult] = useState('');
    const [tagMs, setTagMs] = useState<number | null>(null);
    const [tagLoading, setTagLoading] = useState(false);

    const runTags = async () => {
        setTagLoading(true);
        setTagResult('');
        const t0 = performance.now();
        const tags = await suggestTagsForArticle('Sample Article', tagInput, 5);
        setTagMs(Math.round(performance.now() - t0));
        setTagResult(tags.length ? tags.join(', ') : '(no tags returned)');
        setTagLoading(false);
    };

    // ── Summarizer ───────────────────────────
    const [sumInput, setSumInput] = useState(SAMPLE_TEXT);
    const [sumType, setSumType] = useState<SummarizerType>('tldr' as SummarizerType);
    const [sumLength, setSumLength] = useState<SummarizerLength>('medium');
    const [sumResult, setSumResult] = useState('');
    const [sumMs, setSumMs] = useState<number | null>(null);
    const [sumLoading, setSumLoading] = useState(false);

    const runSummarize = async () => {
        setSumLoading(true);
        setSumResult('');
        const t0 = performance.now();
        const result = await summarizeArticle(sumInput, { type: sumType, length: sumLength });
        setSumMs(Math.round(performance.now() - t0));
        setSumResult(result ?? '(summarizer returned null)');
        setSumLoading(false);
    };

    // ── Language detection ────────────────────
    const [detectInput, setDetectInput] = useState(SAMPLE_TEXT);
    const [detectResult, setDetectResult] = useState('');
    const [detectMs, setDetectMs] = useState<number | null>(null);
    const [detectLoading, setDetectLoading] = useState(false);

    const runDetect = async () => {
        setDetectLoading(true);
        setDetectResult('');
        const t0 = performance.now();
        const result = await detectLanguage(detectInput);
        setDetectMs(Math.round(performance.now() - t0));
        if (result) {
            const match = LANGUAGES.find(l => l.code === result.language || result.language.startsWith(l.code));
            setDetectResult(
                `${result.language} — ${match?.name ?? 'unknown'} ${match?.flag ?? ''}\nConfidence: ${(result.confidence * 100).toFixed(1)}%`
            );
        } else {
            setDetectResult('(detection returned null — API may be unavailable)');
        }
        setDetectLoading(false);
    };

    // ── Translator ───────────────────────────
    const [transInput, setTransInput] = useState(SAMPLE_TEXT);
    const [transSource, setTransSource] = useState('en');
    const [transTarget, setTransTarget] = useState('es');
    const [transResult, setTransResult] = useState('');
    const [transMs, setTransMs] = useState<number | null>(null);
    const [transLoading, setTransLoading] = useState(false);

    const runTranslate = async () => {
        setTransLoading(true);
        setTransResult('');
        const t0 = performance.now();
        const result = await translateText(transInput, transSource, transTarget);
        setTransMs(Math.round(performance.now() - t0));
        setTransResult(result ?? '(translator returned null — pair may be unavailable)');
        setTransLoading(false);
    };

    return (
        <div className="ai-playground">
            <h2>Chrome Built-in AI Playground</h2>
            <p className="subtitle">Test on-device AI models directly in the browser. Requires Chrome 138+ with flags enabled.</p>

            {/* Status cards */}
            <div className="status-grid">
                <div className="status-card">
                    <span className="api-name">Prompt API</span>
                    <span className={`api-status ${statusClass(statuses.prompt)}`}>{statusText(statuses.prompt)}</span>
                </div>
                <div className="status-card">
                    <span className="api-name">Summarizer</span>
                    <span className={`api-status ${statusClass(statuses.summarizer)}`}>{statusText(statuses.summarizer)}</span>
                </div>
                <div className="status-card">
                    <span className="api-name">Language Detector</span>
                    <span className={`api-status ${statusClass(statuses.languageDetector)}`}>{statusText(statuses.languageDetector)}</span>
                </div>
                <div className="status-card">
                    <span className="api-name">Translator (en→es)</span>
                    <span className={`api-status ${statusClass(translatorStatus)}`}>{statusText(translatorStatus)}</span>
                </div>
            </div>

            {/* Prompt / Tags */}
            <div className="test-section">
                <h3>Prompt API — Tag Suggestion</h3>
                <textarea value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Paste article text…" />
                <div className="controls">
                    <button className="run-btn" onClick={runTags} disabled={tagLoading || statuses.prompt !== 'available'}>
                        {tagLoading ? 'Running…' : 'Generate Tags'}
                    </button>
                </div>
                {tagResult && <div className="result-box">{tagResult}</div>}
                {tagMs !== null && <div className="timing">{tagMs}ms</div>}
            </div>

            {/* Summarizer */}
            <div className="test-section">
                <h3>Summarizer API</h3>
                <textarea value={sumInput} onChange={e => setSumInput(e.target.value)} placeholder="Paste text to summarize…" />
                <div className="controls">
                    <select value={sumType} onChange={e => setSumType(e.target.value as SummarizerType)}>
                        <option value="tldr">TL;DR</option>
                        <option value="key-points">Key Points</option>
                        <option value="teaser">Teaser</option>
                        <option value="headline">Headline</option>
                    </select>
                    <select value={sumLength} onChange={e => setSumLength(e.target.value as SummarizerLength)}>
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                    </select>
                    <button className="run-btn" onClick={runSummarize} disabled={sumLoading || statuses.summarizer !== 'available'}>
                        {sumLoading ? 'Running…' : 'Summarize'}
                    </button>
                </div>
                {sumResult && <div className="result-box">{sumResult}</div>}
                {sumMs !== null && <div className="timing">{sumMs}ms</div>}
            </div>

            {/* Language Detection */}
            <div className="test-section">
                <h3>Language Detector API</h3>
                <textarea value={detectInput} onChange={e => setDetectInput(e.target.value)} placeholder="Paste text to detect language…" />
                <div className="controls">
                    <button className="run-btn" onClick={runDetect} disabled={detectLoading || statuses.languageDetector !== 'available'}>
                        {detectLoading ? 'Running…' : 'Detect Language'}
                    </button>
                </div>
                {detectResult && <div className="result-box">{detectResult}</div>}
                {detectMs !== null && <div className="timing">{detectMs}ms</div>}
            </div>

            {/* Translator */}
            <div className="test-section">
                <h3>Translator API</h3>
                <textarea value={transInput} onChange={e => setTransInput(e.target.value)} placeholder="Paste text to translate…" />
                <div className="controls">
                    <select value={transSource} onChange={e => setTransSource(e.target.value)}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                    </select>
                    <span>→</span>
                    <select value={transTarget} onChange={e => setTransTarget(e.target.value)}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                    </select>
                    <button className="run-btn" onClick={runTranslate} disabled={transLoading || translatorStatus === 'unsupported'}>
                        {transLoading ? 'Running…' : 'Translate'}
                    </button>
                </div>
                {transResult && <div className="result-box">{transResult}</div>}
                {transMs !== null && <div className="timing">{transMs}ms</div>}
            </div>
        </div>
    );
};

export default AIPlayground;
