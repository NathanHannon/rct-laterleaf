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
 * Check if user has pro access. This function now takes a boolean.
 * @param isPro - The pro status boolean from the UserStatusContext.
 * @returns boolean
 */
export const hasProAccess = (isPro: boolean): boolean => {
    return isPro;
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
