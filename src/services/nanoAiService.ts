export interface NanoAICapabilities {
    available: 'readily' | 'after-download' | 'no';
}

export interface NanoAISession {
    prompt: (text: string) => Promise<string>;
    destroy: () => void;
}

export interface NanoAICreateOptions {
    monitor?: (m: EventTarget) => void;
    systemPrompt?: string;
}

export interface NanoAIModel {
    capabilities: () => Promise<NanoAICapabilities>;
    create: (options?: NanoAICreateOptions) => Promise<NanoAISession>;
}

export interface ChromeAIProvider extends NanoAIModel {
    languageModel?: NanoAIModel;
    assistant?: NanoAIModel;
}

declare global {
    interface Window {
        ai?: ChromeAIProvider;
    }
}

/**
 * Gets the correct language model instance regardless of Chrome version.
 */
const getLanguageModel = () => {
    if (!window.ai) return null;
    return window.ai.languageModel || window.ai.assistant || window.ai;
};

/**
 * Checks if the Chrome LanguageModel API is available and ready.
 */
export const checkNanoAvailability = async (): Promise<boolean> => {
    const model = getLanguageModel();
    if (!model || typeof model.capabilities !== 'function') return false;
    try {
        const caps = await model.capabilities();
        return caps.available === 'readily';
    } catch {
        return false;
    }
};

/**
 * Returns the raw availability status of the Nano model.
 */
export const getNanoStatus = async (): Promise<'readily' | 'after-download' | 'no' | 'unsupported'> => {
    const model = getLanguageModel();
    if (!model || typeof model.capabilities !== 'function') return 'unsupported';
    try {
        const caps = await model.capabilities();
        return caps.available || 'no';
    } catch {
        return 'no';
    }
};

/**
 * Triggers the download of the Nano model and tracks progress.
 */
export const downloadNanoModel = async (onProgress?: (loaded: number, total: number) => void): Promise<boolean> => {
    const model = getLanguageModel();
    if (!model || typeof model.create !== 'function') return false;

    try {
        const session = await model.create({
            monitor(m: EventTarget) {
                m.addEventListener('downloadprogress', (e: Event) => {
                    if (onProgress) {
                        const progressEvent = e as ProgressEvent;
                        onProgress(progressEvent.loaded, progressEvent.total);
                    }
                });
            }
        });

        // Immediately destroy after downloading since we only wanted to trigger the fetch
        session.destroy();
        return true;
    } catch (err) {
        console.error("Failed to download Gemini Nano:", err);
        return false;
    }
};

/**
 * Uses Gemini Nano (via Chrome's built-in AI API) to suggest tags for an article.
 * @param title The article title
 * @param textContent A chunk of the article's text content/excerpt
 * @param count Number of tags to suggest
 * @returns An array of tag strings
 */
export const suggestTagsForArticle = async (
    title: string,
    textContent: string,
    count: number = 3
): Promise<string[]> => {
    if (!(await checkNanoAvailability())) return [];

    const model = getLanguageModel();
    if (!model) return [];

    try {
        // Truncate text content to avoid blowing out the local context window (typically small, ~4k tokens)
        const safeText = textContent.slice(0, 3000);

        const session = await model.create({
            systemPrompt: `You are an assistant that suggests exactly ${count} short, relevant tags for an article. Reply ONLY with the tags separated by commas, in lowercase. Do not include any other text, quotes, or markdown formatting.`
        });

        const promptContent = `Title: ${title}\n\nContent: ${safeText}\n\nTags:`;
        const response = await session.prompt(promptContent);

        session.destroy();

        // Process the comma-separated string back into an array of clean tags
        return response
            .split(',')
            .map((t: string) => t.trim().toLowerCase())
            .filter((t: string) => t.length > 0 && t.length <= 25); // Ignore empty or excessively long tags
    } catch (error) {
        console.error("Failed to generate tags with Gemini Nano:", error);
        return [];
    }
};
