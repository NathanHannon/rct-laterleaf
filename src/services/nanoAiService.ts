// ────────────────────────────────────────────
// Chrome Built-in AI Service
// Uses the standardised global constructors:
//   LanguageModel  – Prompt API  (general-purpose LLM)
//   Summarizer     – Summarizer API
//   Translator     – Translator API
//   LanguageDetector – Language Detector API
// Types come from @types/dom-chromium-ai
// ────────────────────────────────────────────

// ── Availability helpers ──────────────────────

export type ChromeAIStatus = Availability | 'unsupported';

/**
 * Checks whether the Prompt API (LanguageModel) is supported AND ready to use.
 */
export const checkNanoAvailability = async (): Promise<boolean> => {
    if (typeof LanguageModel === 'undefined') return false;
    try {
        const status = await LanguageModel.availability();
        return status === 'available';
    } catch {
        return false;
    }
};

/**
 * Returns the status of the Prompt API model.
 */
export const getNanoStatus = async (): Promise<ChromeAIStatus> => {
    if (typeof LanguageModel === 'undefined') return 'unsupported';
    try {
        return await LanguageModel.availability();
    } catch {
        return 'unavailable';
    }
};

/**
 * Returns the status of the Summarizer API model.
 */
export const getSummarizerStatus = async (): Promise<ChromeAIStatus> => {
    if (typeof Summarizer === 'undefined') return 'unsupported';
    try {
        return await Summarizer.availability();
    } catch {
        return 'unavailable';
    }
};

/**
 * Returns the status of the Language Detector model.
 */
export const getLanguageDetectorStatus = async (): Promise<ChromeAIStatus> => {
    if (typeof LanguageDetector === 'undefined') return 'unsupported';
    try {
        return await LanguageDetector.availability();
    } catch {
        return 'unavailable';
    }
};

/**
 * Returns the status of the Translator model for a given language pair.
 */
export const getTranslatorStatus = async (
    sourceLanguage: string,
    targetLanguage: string,
): Promise<ChromeAIStatus> => {
    if (typeof Translator === 'undefined') return 'unsupported';
    try {
        return await Translator.availability({ sourceLanguage, targetLanguage });
    } catch {
        return 'unavailable';
    }
};

/**
 * Aggregate: returns a map of each API's availability.
 */
export const getAllAIStatus = async () => ({
    prompt: await getNanoStatus(),
    summarizer: await getSummarizerStatus(),
    languageDetector: await getLanguageDetectorStatus(),
});

// ── Download / create helpers ─────────────────

type ProgressCb = (loaded: number, total: number) => void;

const makeMonitor = (onProgress?: ProgressCb): CreateMonitorCallback | undefined => {
    if (!onProgress) return undefined;
    return (m) => {
        m.addEventListener('downloadprogress', (e) => {
            onProgress(e.loaded, e.total);
        });
    };
};

/**
 * Triggers a LanguageModel session to force-download the Gemini Nano model.
 */
export const downloadNanoModel = async (onProgress?: ProgressCb): Promise<boolean> => {
    if (typeof LanguageModel === 'undefined') return false;
    try {
        const session = await LanguageModel.create({ monitor: makeMonitor(onProgress) });
        session.destroy();
        return true;
    } catch (err) {
        console.error('Failed to download Gemini Nano:', err);
        return false;
    }
};

// ── Session caches ────────────────────────────
// Reusing initialized Chrome Built-in AI sessions avoids re-creating the
// on-device pipeline on every request. LanguageModel sessions accumulate
// history per prompt, so we cache a base session per prompt config and clone
// it per call; stateless APIs (Summarizer, LanguageDetector, Translator) are
// reused directly.

const MAX_CACHED_SUMMARIZERS = 6;
const MAX_CACHED_TRANSLATORS = 8;
const MAX_CACHED_TAG_SESSIONS = 4;

const tagBaseSessions = new Map<number, Promise<LanguageModel>>();
const summarizerCache = new Map<string, Promise<Summarizer>>();
const translatorCache = new Map<string, Promise<Translator>>();
let detectorPromise: Promise<LanguageDetector> | null = null;

const safeDestroy = (session: { destroy?: () => void } | null | undefined) => {
    try {
        session?.destroy?.();
    } catch {
        // Ignore cleanup errors on already-destroyed sessions
    }
};

const evictOldestIfFull = <K, V extends { destroy?: () => void }>(
    cache: Map<K, Promise<V>>,
    maxEntries: number,
) => {
    while (cache.size >= maxEntries) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey === undefined) break;
        const oldestPromise = cache.get(oldestKey);
        cache.delete(oldestKey);
        oldestPromise?.then(safeDestroy).catch(() => undefined);
    }
};

const getOrCreateTagBaseSession = (count: number): Promise<LanguageModel> => {
    const existing = tagBaseSessions.get(count);
    if (existing) {
        tagBaseSessions.delete(count);
        tagBaseSessions.set(count, existing);
        return existing;
    }

    evictOldestIfFull(tagBaseSessions, MAX_CACHED_TAG_SESSIONS);
    const created = LanguageModel.create({
        initialPrompts: [{
            role: 'system' as LanguageModelSystemMessageRole,
            content: `You are an assistant that suggests exactly ${count} short, relevant tags for an article. Reply ONLY with the tags separated by commas, in lowercase. Do not include any other text, quotes, or markdown formatting.`,
        }],
    }).catch((err) => {
        tagBaseSessions.delete(count);
        throw err;
    });
    tagBaseSessions.set(count, created);
    return created;
};

const getOrCreateSummarizer = (
    type: SummarizerType,
    length: SummarizerLength,
    format: SummarizerFormat,
    onProgress?: ProgressCb,
): Promise<Summarizer> => {
    const key = `${type}:${length}:${format}`;
    const existing = summarizerCache.get(key);
    if (existing) {
        summarizerCache.delete(key);
        summarizerCache.set(key, existing);
        return existing;
    }

    evictOldestIfFull(summarizerCache, MAX_CACHED_SUMMARIZERS);
    const created = Summarizer.create({
        type,
        length,
        format,
        monitor: makeMonitor(onProgress),
    }).catch((err) => {
        summarizerCache.delete(key);
        throw err;
    });
    summarizerCache.set(key, created);
    return created;
};

const getOrCreateLanguageDetector = (): Promise<LanguageDetector> => {
    if (!detectorPromise) {
        detectorPromise = LanguageDetector.create().catch((err) => {
            detectorPromise = null;
            throw err;
        });
    }
    return detectorPromise;
};

const getOrCreateTranslator = (
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: ProgressCb,
): Promise<Translator> => {
    const key = `${sourceLanguage}->${targetLanguage}`;
    const existing = translatorCache.get(key);
    if (existing) {
        translatorCache.delete(key);
        translatorCache.set(key, existing);
        return existing;
    }

    evictOldestIfFull(translatorCache, MAX_CACHED_TRANSLATORS);
    const created = Translator.create({
        sourceLanguage,
        targetLanguage,
        monitor: makeMonitor(onProgress),
    }).catch((err) => {
        translatorCache.delete(key);
        throw err;
    });
    translatorCache.set(key, created);
    return created;
};

/**
 * Destroys all cached Chrome Built-in AI sessions and clears the caches.
 */
export const clearNanoSessionCaches = async (): Promise<void> => {
    const toDestroy: Promise<{ destroy?: () => void }>[] = [
        ...tagBaseSessions.values(),
        ...summarizerCache.values(),
        ...translatorCache.values(),
        ...(detectorPromise ? [detectorPromise] : []),
    ];
    tagBaseSessions.clear();
    summarizerCache.clear();
    translatorCache.clear();
    detectorPromise = null;

    await Promise.allSettled(toDestroy.map((p) => p.then(safeDestroy)));
};

// ── Prompt API: tag suggestion ────────────────

export const suggestTagsForArticle = async (
    title: string,
    textContent: string,
    count: number = 3,
): Promise<string[]> => {
    if (!(await checkNanoAvailability())) return [];
    const safeText = textContent.slice(0, 3000);
    const promptText = `Title: ${title}\n\nContent: ${safeText}\n\nTags:`;

    const runWithSession = async (useCachedBase: boolean): Promise<string> => {
        const baseSession = await getOrCreateTagBaseSession(count);
        if (typeof baseSession.clone === 'function') {
            const cloned = await baseSession.clone();
            try {
                return await cloned.prompt(promptText);
            } finally {
                safeDestroy(cloned);
            }
        }
        // Fallback if clone() is unavailable in this browser build
        if (useCachedBase) {
            tagBaseSessions.delete(count);
        }
        try {
            return await baseSession.prompt(promptText);
        } finally {
            safeDestroy(baseSession);
        }
    };

    try {
        let response: string;
        try {
            response = await runWithSession(true);
        } catch {
            // Cached base session may have been evicted by the browser; recreate once
            const stale = tagBaseSessions.get(count);
            tagBaseSessions.delete(count);
            stale?.then(safeDestroy).catch(() => undefined);
            response = await runWithSession(false);
        }

        return response
            .split(',')
            .map((t: string) => t.trim().toLowerCase())
            .filter((t: string) => t.length > 0 && t.length <= 25);
    } catch (error) {
        console.error('Failed to generate tags with Gemini Nano:', error);
        return [];
    }
};

// ── Summarizer API ────────────────────────────

export const summarizeArticle = async (
    text: string,
    options?: {
        type?: SummarizerType;
        length?: SummarizerLength;
        format?: SummarizerFormat;
        context?: string;
        onProgress?: ProgressCb;
    },
): Promise<string | null> => {
    if (typeof Summarizer === 'undefined') return null;
    try {
        const status = await Summarizer.availability();
        if (status === 'unavailable') return null;

        const type = options?.type ?? 'key-points';
        const length = options?.length ?? 'medium';
        const format = options?.format ?? 'markdown';
        const key = `${type}:${length}:${format}`;

        const run = async () => {
            const summarizer = await getOrCreateSummarizer(type, length, format, options?.onProgress);
            return summarizer.summarize(text, { context: options?.context });
        };

        try {
            return await run();
        } catch {
            const stale = summarizerCache.get(key);
            summarizerCache.delete(key);
            stale?.then(safeDestroy).catch(() => undefined);
            return await run();
        }
    } catch (error) {
        console.error('Summarizer failed:', error);
        return null;
    }
};

// ── Language Detector API ─────────────────────

export interface DetectedLanguage {
    language: string;
    confidence: number;
}

export const detectLanguage = async (
    text: string,
): Promise<DetectedLanguage | null> => {
    if (typeof LanguageDetector === 'undefined') return null;
    try {
        const status = await LanguageDetector.availability();
        if (status === 'unavailable') return null;

        const run = async () => {
            const detector = await getOrCreateLanguageDetector();
            return detector.detect(text);
        };

        let results: LanguageDetectionResult[];
        try {
            results = await run();
        } catch {
            const stale = detectorPromise;
            detectorPromise = null;
            stale?.then(safeDestroy).catch(() => undefined);
            results = await run();
        }

        if (results.length === 0) return null;
        return {
            language: results[0].detectedLanguage ?? 'unknown',
            confidence: results[0].confidence ?? 0,
        };
    } catch (error) {
        console.error('Language detection failed:', error);
        return null;
    }
};

// ── Translator API ────────────────────────────

export const translateText = async (
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: ProgressCb,
): Promise<string | null> => {
    if (typeof Translator === 'undefined') return null;
    try {
        const status = await Translator.availability({ sourceLanguage, targetLanguage });
        if (status === 'unavailable') return null;

        const key = `${sourceLanguage}->${targetLanguage}`;
        const run = async () => {
            const translator = await getOrCreateTranslator(sourceLanguage, targetLanguage, onProgress);
            return translator.translate(text);
        };

        try {
            return await run();
        } catch {
            const stale = translatorCache.get(key);
            translatorCache.delete(key);
            stale?.then(safeDestroy).catch(() => undefined);
            return await run();
        }
    } catch (error) {
        console.error('Translation failed:', error);
        return null;
    }
};
