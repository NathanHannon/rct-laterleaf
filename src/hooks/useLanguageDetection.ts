import { useState, useEffect } from 'react';
import { detectLanguage } from '../services/nanoAiService';
import { LANGUAGES } from '../constants/languages';

/**
 * Attempts on-device language detection via Chrome's LanguageDetector API.
 * Returns the detected ISO language code (mapped to our supported languages)
 * or null if unavailable / not confident enough. Graceful no-op on non-Chrome browsers.
 */
export function useLanguageDetection(text: string | undefined | null) {
    const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

    useEffect(() => {
        if (!text || text.length < 50) {
            setDetectedLanguage(null);
            return;
        }

        let cancelled = false;

        (async () => {
            // Use a representative sample — first ~2000 chars is plenty for detection
            const sample = text.slice(0, 2000);
            const result = await detectLanguage(sample);

            if (cancelled || !result) return;

            // Only trust high-confidence detections
            if (result.confidence < 0.6) return;

            // Map the BCP-47 language tag to one of our supported codes
            const code = result.language; // e.g. "en", "es", "pt"
            const match = LANGUAGES.find(
                l => l.code === code || l.code.startsWith(code) || code.startsWith(l.code),
            );

            if (match && !cancelled) {
                setDetectedLanguage(match.code);
            }
        })();

        return () => { cancelled = true; };
    }, [text]);

    return detectedLanguage;
}
