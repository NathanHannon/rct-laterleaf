export interface PodcastStatus {
    hasAudio: boolean;
    audioUrl?: string;
    status?: string;
    canGenerate?: boolean;
    isProUser?: boolean;
    audioLanguage?: string;
    podcastScript?: { script?: string };
}

// The article already contains the saved URL. Use it only until status is known;
// an explicit empty status (including deletion) must never revive that old URL.
export function resolvePodcastAudioUrl(status: PodcastStatus | null | undefined, savedAudioUrl?: string): string | null {
    if (status === undefined) return savedAudioUrl || null;
    return status?.audioUrl || null;
}
