import { useAuth } from "@clerk/react";
import { useQuery } from '@tanstack/react-query';

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

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['user', 'credits'],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user credits');
      }

      return response.json();
    },
  });

  const credits: UserCredits | null = data?.credits || null;
  const isPro: boolean = data?.hasProAccess || false;
  const error: string | null = queryError instanceof Error ? queryError.message : queryError ? 'Unknown error occurred' : null;

  return {
    credits,
    isPro,
    loading,
    error,
    fetchCredits: refetch,
    refetch,
  };
};
