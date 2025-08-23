import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface UserCredits {
    basicCreditsUsed: number;
    basicCreditsLimit: number;
    basicCreditsRemaining: number;
    proCreditsUsed: number;
    proCreditsLimit: number;
    proCreditsRemaining: number;
    resetAt: string;
    daysUntilReset: number;
    needsReset: boolean;
}

/**
 * Hook to fetch user credit information from the API
 * Use this only when you need credit data (e.g., on settings page)
 */
export const useUserCredits = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isPro, setIsPro] = useState(false); // Add state for pro status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user credits');
      }

      const data = await response.json();
      setCredits(data.credits);
      setIsPro(data.hasProAccess); // Set pro status from the response
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unknown error occurred',
      );
      console.error('Error fetching user credits:', err);
      setIsPro(false); // Default to false on error
    } finally {
      setLoading(false);
    }
  };

  return {
    credits,
    isPro, // Return the pro status
    loading,
    error,
    fetchCredits,
    refetch: fetchCredits,
  };
};
