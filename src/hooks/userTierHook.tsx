import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface UserTierData {
    user: {
        id: string;
        clerkId: string;
        tier: 'free' | 'pro';
        createdAt: string;
        updatedAt: string;
    };
    hasProAccess: boolean;
}

export const useUserTier = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [tierData, setTierData] = useState<UserTierData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserTier = async () => {
            if (!isLoaded || !isSignedIn) {
                console.log('🔐 UserTier: Not loaded or not signed in, skipping fetch');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                console.log('🔄 UserTier: Fetching user tier from /api/users/me...');
                const token = await getToken();
                const response = await fetch('/api/users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user tier information');
                }

                const data: UserTierData = await response.json();
                console.log('✅ UserTier: Received tier data:', {
                    tier: data.user.tier,
                    hasProAccess: data.hasProAccess,
                    userId: data.user.id,
                    clerkId: data.user.clerkId
                });
                setTierData(data);
            } catch (err) {
                console.error('❌ UserTier: Error fetching user tier:', err);
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchUserTier();
    }, [isLoaded, isSignedIn, getToken]); return {
        tierData,
        hasProAccess: tierData?.hasProAccess ?? false,
        userTier: tierData?.user?.tier ?? 'free',
        loading,
        error,
        refetch: () => {
            if (isLoaded && isSignedIn) {
                setLoading(true);
                const fetchUserTier = async () => {
                    try {
                        const token = await getToken();
                        const response = await fetch('/api/users/me', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error('Failed to fetch user tier information');
                        }

                        const data: UserTierData = await response.json();
                        setTierData(data);
                        setError(null);
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Unknown error occurred');
                        console.error('Error fetching user tier:', err);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchUserTier();
            }
        }
    };
};
