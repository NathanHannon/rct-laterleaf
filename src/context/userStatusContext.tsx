import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface UserStatusContextType {
    isPro: boolean;
    isLoading: boolean;
}

const UserStatusContext = createContext<UserStatusContextType | undefined>(undefined);

export const UserStatusProvider = ({ children }: { children: ReactNode }) => {
    const { getToken, isSignedIn } = useAuth();
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!isSignedIn) {
                setIsPro(false);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const token = await getToken();
                const response = await fetch('/api/users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user status');
                }

                const data = await response.json();
                // The backend sends `hasProAccess`
                setIsPro(data.hasProAccess);
            } catch (error) {
                console.error('Error fetching user pro status:', error);
                setIsPro(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, [isSignedIn, getToken]);

    return (
        <UserStatusContext.Provider value={{ isPro, isLoading }}>
            {children}
        </UserStatusContext.Provider>
    );
};

export const useUserStatus = () => {
    const context = useContext(UserStatusContext);
    if (context === undefined) {
        throw new Error('useUserStatus must be used within a UserStatusProvider');
    }
    return context;
};