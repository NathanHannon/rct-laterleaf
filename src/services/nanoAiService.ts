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

// ── Prompt API: tag suggestion ────────────────

export const suggestTagsForArticle = async (
    title: string,
    textContent: string,
    count: number = 3,
): Promise<string[]> => {
    if (!(await checkNanoAvailability())) return [];
    try {
        const safeText = textContent.slice(0, 3000);
        const session = await LanguageModel.create({
            initialPrompts: [{
                role: 'system' as LanguageModelSystemMessageRole,
                content: `You are an assistant that suggests exactly ${count} short, relevant tags for an article. Reply ONLY with the tags separated by commas, in lowercase. Do not include any other text, quotes, or markdown formatting.`,
            }],
        });

        const response = await session.prompt(
            `Title: ${title}\n\nContent: ${safeText}\n\nTags:`,
        );
        session.destroy();

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

        const summarizer = await Summarizer.create({
            type: options?.type ?? 'key-points',
            length: options?.length ?? 'medium',
            format: options?.format ?? 'markdown',
            monitor: makeMonitor(options?.onProgress),
        });

        const summary = await summarizer.summarize(text, {
            context: options?.context,
        });
        summarizer.destroy();
        return summary;
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

        const detector = await LanguageDetector.create();
        const results = await detector.detect(text);
        detector.destroy();

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

        const translator = await Translator.create({
            sourceLanguage,
            targetLanguage,
            monitor: makeMonitor(onProgress),
        });

        const translated = await translator.translate(text);
        translator.destroy();
        return translated;
    } catch (error) {
        console.error('Translation failed:', error);
        return null;
    }
};
