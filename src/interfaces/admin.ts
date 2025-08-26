
export interface BlockedDomain {
    id: string;
    domain: string;
    reason: 'spam' | 'malicious' | 'inappropriate' | 'scam' | 'phishing';
    notes?: string;
    createdAt: string;
}

export interface AdminStats {
    blockedDomains: number;
    blockedByReason: Array<{ reason: string; count: number }>;
}

export interface AdminAccess {
    isAdmin: boolean;
    clerkId: string;
    metadata?: Record<string, unknown>;
}
