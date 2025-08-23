import type { UserResource } from '@clerk/types';

/**
 * Extract user tier from Clerk's JWT token
 * @param user - Clerk user object
 * @returns 'pro' | 'free'
 */
export const extractUserTier = (user: UserResource | null | undefined): 'pro' | 'free' => {
    if (!user) return 'free';

    // Check publicMetadata first, as it's synced from our DB via webhooks.
    if (user.publicMetadata?.isPro === true || user.publicMetadata?.role === 'admin') {
        return 'pro';
    }

    // Fallback for older JWTs or if metadata sync is delayed.
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
 * Check if user has pro access. Prefers the synced `isPro` flag from public metadata.
 * @param user - Clerk user object
 * @returns boolean
 */
export const hasProAccess = (user: UserResource | null | undefined): boolean => {
    if (!user) return false;
    // The primary source of truth is the `isPro` flag synced from our database.
    // The admin role is a permanent override.
    return user.publicMetadata?.isPro === true || user.publicMetadata?.role === 'admin';
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
