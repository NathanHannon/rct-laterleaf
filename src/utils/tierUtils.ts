import type { UserResource } from '@clerk/types';

/**
 * Extract user tier from Clerk's JWT token
 * @param user - Clerk user object
 * @returns 'pro' | 'free'
 */
export const extractUserTier = (user: UserResource | null | undefined): 'pro' | 'free' => {
    if (!user) return 'free';

    // Check if user has admin role in publicMetadata first
    if (user.publicMetadata?.role === 'admin') {
        console.log('🔱 Admin user detected, granting pro access');
        return 'pro';
    }

    // Access the raw token from Clerk's user object
    // The tier info is in the 'pla' field (e.g., "u:free_user" or "u:pro_user")
    const userWithToken = user as UserResource & {
        unsafeMetadata?: { _rawToken?: { pla?: string } };
        __unstable__environment?: { jwt?: { pla?: string } };
    };

    const rawToken = userWithToken.unsafeMetadata?._rawToken ||
        userWithToken.__unstable__environment?.jwt ||
        {};

    const plaField = rawToken.pla || 'u:free_user';

    // Extract tier from pla field
    return plaField.includes('pro') ? 'pro' : 'free';
};

/**
 * Check if user has pro access
 * @param user - Clerk user object
 * @returns boolean
 */
export const hasProAccess = (user: UserResource | null | undefined): boolean => {
    return extractUserTier(user) === 'pro';
};

/**
 * Get user tier display name
 * @param user - Clerk user object
 * @returns 'Pro' | 'Free'
 */
export const getTierDisplayName = (user: UserResource | null | undefined): string => {
    const tier = extractUserTier(user);
    return tier === 'pro' ? 'Pro' : 'Free';
};
