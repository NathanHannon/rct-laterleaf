import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faClipboard, faFlask, faPlay, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {
    AiComparisonResponse,
    AiComparisonResult,
    AiModelTier,
    AiProvider,
    AiProviderMode,
} from '../../../interfaces/admin';
import './AiComparisonPanel.scss';

const PROVIDER_LABELS: Record<AiProvider, string> = {
    gemini: 'Gemini',
    'openai-compatible': 'OpenAI',
};

const AiComparisonPanel = () => {
    const { getToken } = useAuth();
    const [providerMode, setProviderMode] = useState<AiProviderMode>('compare');
    const [modelTier, setModelTier] = useState<AiModelTier>('free');
    const [prompt, setPrompt] = useState('Summarize the tradeoffs between retrieval quality, latency, and cost in a semantic search system.');
    const [results, setResults] = useState<AiComparisonResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [copiedProvider, setCopiedProvider] = useState<AiProvider | null>(null);

    const providers: AiProvider[] = providerMode === 'compare'
        ? ['gemini', 'openai-compatible']
        : [providerMode];

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!prompt.trim() || isRunning) return;

        setIsRunning(true);
        setError(null);
        setCopiedProvider(null);

        try {
            const token = await getToken();
            const response = await fetch('/api/ai/compare', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, model: modelTier, providers }),
            });

            const body = await response.json() as AiComparisonResponse & { message?: string };
            if (!response.ok) {
                throw new Error(body.message || 'Comparison request failed');
            }

            setResults(body.results);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Comparison request failed');
        } finally {
            setIsRunning(false);
        }
    };

    const copyResult = async (result: AiComparisonResult) => {
        if (!result.text) return;
        await navigator.clipboard.writeText(result.text);
        setCopiedProvider(result.provider);
    };

    return (
        <motion.section
            className="ai-comparison"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="ai-comparison__heading">
                <div className="ai-comparison__icon" aria-hidden="true">
                    <FontAwesomeIcon icon={faFlask} />
                </div>
                <div>
                    <p className="ai-comparison__eyebrow">AI Lab</p>
                    <h2>Provider comparison</h2>
                </div>
            </div>

            <form className="ai-comparison__form" onSubmit={handleSubmit} action="/api/ai/compare" method="post">
                <div className="ai-comparison__controls">
                    <fieldset className="ai-segmented-control">
                        <legend>Provider</legend>
                        <div className="ai-segmented-control__options">
                            {([
                                ['gemini', 'Gemini'],
                                ['openai-compatible', 'OpenAI'],
                                ['compare', 'Compare'],
                            ] as const).map(([value, label]) => (
                                <label key={value}>
                                    <input
                                        type="radio"
                                        name="providerMode"
                                        value={value}
                                        checked={providerMode === value}
                                        onChange={() => setProviderMode(value)}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="ai-segmented-control">
                        <legend>Model tier</legend>
                        <div className="ai-segmented-control__options">
                            {([
                                ['free', 'Free'],
                                ['pro', 'Pro'],
                                ['podcast', 'Podcast'],
                            ] as const).map(([value, label]) => (
                                <label key={value}>
                                    <input
                                        type="radio"
                                        name="modelTier"
                                        value={value}
                                        checked={modelTier === value}
                                        onChange={() => setModelTier(value)}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </div>

                <div className="ai-comparison__prompt-field">
                    <div className="ai-comparison__prompt-label">
                        <label htmlFor="ai-comparison-prompt">Prompt</label>
                        <span>{prompt.length.toLocaleString()} / 20,000</span>
                    </div>
                    <textarea
                        id="ai-comparison-prompt"
                        name="prompt"
                        value={prompt}
                        onChange={(event) => {
                            setPrompt(event.target.value);
                            setError(null);
                        }}
                        maxLength={20_000}
                        rows={7}
                        required
                    />
                </div>

                <div className="ai-comparison__actions">
                    <button type="submit" disabled={isRunning}>
                        <FontAwesomeIcon icon={faPlay} />
                        {isRunning ? 'Running comparison...' : providerMode === 'compare' ? 'Run both providers' : `Run ${PROVIDER_LABELS[providerMode]}`}
                    </button>
                    <span aria-live="polite">
                        {isRunning ? `${providers.length} provider request${providers.length > 1 ? 's' : ''} in progress` : ''}
                    </span>
                </div>
            </form>

            {error && (
                <div className="ai-comparison__error" role="alert">
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    {error}
                </div>
            )}

            {results.length > 0 && (
                <div className={`ai-comparison__results ${results.length === 1 ? 'ai-comparison__results--single' : ''}`}>
                    {results.map((result, index) => (
                        <motion.article
                            className="ai-result"
                            key={result.provider}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                        >
                            <header className="ai-result__header">
                                <div>
                                    <p>{PROVIDER_LABELS[result.provider]}</p>
                                    <h3>{result.model || 'Request failed'}</h3>
                                </div>
                                {result.text && (
                                    <button type="button" onClick={() => copyResult(result)} title={`Copy ${PROVIDER_LABELS[result.provider]} response`}>
                                        <FontAwesomeIcon icon={copiedProvider === result.provider ? faCheck : faClipboard} />
                                        <span className="visually-hidden">Copy response</span>
                                    </button>
                                )}
                            </header>

                            <div className="ai-result__metrics">
                                <span>{(result.durationMs / 1000).toFixed(2)}s</span>
                                {result.inputTokens !== undefined && <span>{result.inputTokens.toLocaleString()} in</span>}
                                {result.outputTokens !== undefined && <span>{result.outputTokens.toLocaleString()} out</span>}
                                {result.estimatedCostUsd !== undefined && (
                                    <span title="Estimated from current standard list prices">
                                        ${result.estimatedCostUsd.toFixed(6)} est.
                                    </span>
                                )}
                            </div>

                            {result.error ? (
                                <div className="ai-result__error" role="status">
                                    <FontAwesomeIcon icon={faTriangleExclamation} />
                                    <p>{result.error}</p>
                                </div>
                            ) : (
                                <div className="ai-result__content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.text || ''}</ReactMarkdown>
                                </div>
                            )}
                        </motion.article>
                    ))}
                </div>
            )}
        </motion.section>
    );
};

export default AiComparisonPanel;