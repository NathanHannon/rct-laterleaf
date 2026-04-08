import { createContext, type ReactNode } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery } from '@tanstack/react-query';

interface UserStatusContextType {
    isPro: boolean;
    isLoading: boolean;
}

export const UserStatusContext = createContext<UserStatusContextType | undefined>(undefined);

export const UserStatusProvider = ({ children }: { children: ReactNode }) => {
    const { getToken, isSignedIn } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['user', 'status'],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch('/api/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch user status');
            return response.json();
        },
        enabled: !!isSignedIn,
    });

    const isPro = data?.hasProAccess ?? false;

    return (
        <UserStatusContext.Provider value={{ isPro, isLoading }}>
            {children}
        </UserStatusContext.Provider>
    );
};