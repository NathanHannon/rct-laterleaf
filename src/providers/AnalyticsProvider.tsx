import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import posthog from 'posthog-js';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { isSignedIn, userId } = useAuth();
    const { user } = useUser();

    // Handle page views
    useEffect(() => {
        if (import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
            posthog.capture('$pageview');
        }
    }, [location.pathname, location.search]);

    // Handle user identification
    useEffect(() => {
        if (import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
            if (isSignedIn && userId) {
                posthog.identify(userId, {
                    email: user?.primaryEmailAddress?.emailAddress,
                    name: user?.fullName,
                });
            } else if (!isSignedIn) {
                posthog.reset();
            }
        }
    }, [isSignedIn, userId, user]);

    return <>{children}</>;
}
