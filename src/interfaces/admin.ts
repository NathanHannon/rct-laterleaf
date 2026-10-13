export interface BlockedDomain {
    id: string;
    domain: string;
    reason: 'spam' | 'malicious' | 'inappropriate' | 'scam' | 'phishing';
    notes?: string;
    createdAt: string;
}

export interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
}

export interface AdminStats {
    blockedDomains: number;
    blockedByReason: Array<{ reason: string; count: number }>;
    users: {
        total: number;
        pro: number;
    };
    articles: {
        total: number;
    };
    queues: {
        pro: QueueStats;
        audio: QueueStats;
        chunking: QueueStats;
    };
}

export interface AdminUser {
    id: string;
    clerkId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    hasProAccess: boolean;
    createdAt: string;
    lastLoginAt?: string;
}

export interface AdminAccess {
    isAdmin: boolean;
    canSelectAiProvider: boolean;
    clerkId: string;
    metadata?: Record<string, unknown>;
}

export type AiProvider = 'gemini' | 'openai-compatible';
export type AiProviderMode = AiProvider | 'compare';
export type AiModelTier = 'free' | 'pro' | 'podcast';

export interface AiComparisonResult {
    provider: AiProvider;
    model?: string;
    text?: string;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
    durationMs: number;
    error?: string;
}

export interface AiComparisonResponse {
    results: AiComparisonResult[];
}
