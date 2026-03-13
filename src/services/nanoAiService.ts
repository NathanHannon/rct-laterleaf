export interface NanoAICapabilities {
    available: 'readily' | 'after-download' | 'no';
}

export interface NanoAISession {
    prompt: (text: string) => Promise<string>;
    destroy: () => void;
}

declare global {
    interface Window {
        ai?: {
            languageModel?: {
                capabilities: () => Promise<NanoAICapabilities>;
                create: (options?: {
                    systemPrompt?: string;
                    monitor?: (m: EventTarget) => void
                }) => Promise<NanoAISession>;
            };
        };
    }
}

/**
 * Checks if the Chrome LanguageModel API is available and ready.
 */
export const checkNanoAvailability = async (): Promise<boolean> => {
    if (!window.ai?.languageModel) return false;
    try {
        const caps = await window.ai.languageModel.capabilities();
        return caps.available === 'readily';
    } catch {
        return false;
    }
};

/**
 * Returns the raw availability status of the Nano model.
 */
export const getNanoStatus = async (): Promise<'readily' | 'after-download' | 'no'> => {
    if (!window.ai?.languageModel) return 'no';
    try {
        const caps = await window.ai.languageModel.capabilities();
        return caps.available;
    } catch {
        return 'no';
    }
};

/**
 * Triggers the download of the Nano model and tracks progress.
 */
export const downloadNanoModel = async (onProgress?: (loaded: number, total: number) => void): Promise<boolean> => {
    if (!window.ai?.languageModel) return false;

    try {
        const session = await window.ai.languageModel.create({
            monitor(m) {
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

    try {
        // Truncate text content to avoid blowing out the local context window (typically small, ~4k tokens)
        const safeText = textContent.slice(0, 3000);

        const session = await window.ai!.languageModel!.create({
            systemPrompt: `You are an assistant that suggests exactly ${count} short, relevant tags for an article. Reply ONLY with the tags separated by commas, in lowercase. Do not include any other text, quotes, or markdown formatting.`
        });

        const promptContent = `Title: ${title}\n\nContent: ${safeText}\n\nTags:`;
        const response = await session.prompt(promptContent);

        session.destroy();

        // Process the comma-separated string back into an array of clean tags
        return response
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0 && t.length <= 25); // Ignore empty or excessively long tags
    } catch (error) {
        console.error("Failed to generate tags with Gemini Nano:", error);
        return [];
    }
};
