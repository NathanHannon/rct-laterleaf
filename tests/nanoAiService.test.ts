import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
    clearNanoSessionCaches,
    detectLanguage,
    suggestTagsForArticle,
    summarizeArticle,
    translateText,
} from '../src/services/nanoAiService.ts';

const g = globalThis as Record<string, unknown>;

afterEach(async () => {
    await clearNanoSessionCaches();
    delete g.LanguageModel;
    delete g.Summarizer;
    delete g.LanguageDetector;
    delete g.Translator;
});

test('reuses Summarizer session for identical options and recovers if cached session throws', async () => {
    let createCalls = 0;
    let destroyCalls = 0;
    let failNext = false;

    g.Summarizer = {
        availability: async () => 'available',
        create: async () => {
            createCalls += 1;
            const instanceId = createCalls;
            return {
                summarize: async (text: string) => {
                    if (failNext) {
                        failNext = false;
                        throw new Error('session evicted');
                    }
                    return `summary-${instanceId}:${text}`;
                },
                destroy: () => {
                    destroyCalls += 1;
                },
            };
        },
    };

    assert.equal(await summarizeArticle('first'), 'summary-1:first');
    assert.equal(await summarizeArticle('second'), 'summary-1:second');
    assert.equal(createCalls, 1);
    assert.equal(destroyCalls, 0);

    // Simulate browser evicting the cached session
    failNext = true;
    assert.equal(await summarizeArticle('third'), 'summary-2:third');
    assert.equal(createCalls, 2);
    assert.equal(destroyCalls, 1);

    await clearNanoSessionCaches();
    assert.equal(destroyCalls, 2);
});

test('caches LanguageModel base session and clones per call without polluting history', async () => {
    let createCalls = 0;
    let cloneCalls = 0;
    let cloneDestroyCalls = 0;
    let baseDestroyCalls = 0;

    g.LanguageModel = {
        availability: async () => 'available',
        create: async () => {
            createCalls += 1;
            return {
                clone: async () => {
                    cloneCalls += 1;
                    return {
                        prompt: async () => 'tech, ai, productivity',
                        destroy: () => {
                            cloneDestroyCalls += 1;
                        },
                    };
                },
                prompt: async () => 'fallback',
                destroy: () => {
                    baseDestroyCalls += 1;
                },
            };
        },
    };

    const first = await suggestTagsForArticle('Title 1', 'Body 1', 3);
    const second = await suggestTagsForArticle('Title 2', 'Body 2', 3);

    assert.deepEqual(first, ['tech', 'ai', 'productivity']);
    assert.deepEqual(second, ['tech', 'ai', 'productivity']);
    assert.equal(createCalls, 1);
    assert.equal(cloneCalls, 2);
    assert.equal(cloneDestroyCalls, 2);
    assert.equal(baseDestroyCalls, 0);

    await clearNanoSessionCaches();
    assert.equal(baseDestroyCalls, 1);
});

test('reuses LanguageDetector and Translator sessions by language pair', async () => {
    let detectorCreates = 0;
    let translatorCreates = 0;

    g.LanguageDetector = {
        availability: async () => 'available',
        create: async () => {
            detectorCreates += 1;
            return {
                detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }],
                destroy: () => undefined,
            };
        },
    };

    g.Translator = {
        availability: async () => 'available',
        create: async ({ sourceLanguage, targetLanguage }: { sourceLanguage: string; targetLanguage: string }) => {
            translatorCreates += 1;
            return {
                translate: async (text: string) => `[${sourceLanguage}->${targetLanguage}] ${text}`,
                destroy: () => undefined,
            };
        },
    };

    assert.deepEqual(await detectLanguage('hello'), { language: 'en', confidence: 0.99 });
    assert.deepEqual(await detectLanguage('world'), { language: 'en', confidence: 0.99 });
    assert.equal(detectorCreates, 1);

    assert.equal(await translateText('hello', 'en', 'es'), '[en->es] hello');
    assert.equal(await translateText('world', 'en', 'es'), '[en->es] world');
    assert.equal(await translateText('hello', 'en', 'fr'), '[en->fr] hello');
    assert.equal(translatorCreates, 2);
});
