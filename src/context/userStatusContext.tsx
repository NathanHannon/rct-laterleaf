import { createContext, type ReactNode } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery } from '@tanstack/react-query';

interface UserStatusContextType {
    isPro: boolean;
    isLoading: boolean;
}

export const USER_STATUS_QUERY_KEY = ['user', 'status'] as const;

type GetTokenFn = () => Promise<string | null>;

export const fetchUserStatus = async (getToken: GetTokenFn) => {
    const token = await getToken();

    if (!token) {
        throw new Error('Missing auth token');
    }

    const response = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user status');
    }

    return response.json();
};

export const UserStatusContext = createContext<UserStatusContextType | undefined>(undefined);

export const UserStatusProvider = ({ children }: { children: ReactNode }) => {
    const { getToken, isSignedIn } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: USER_STATUS_QUERY_KEY,
        queryFn: () => fetchUserStatus(getToken),
        enabled: !!isSignedIn,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const isPro = data?.hasProAccess ?? false;

    return (
        <UserStatusContext.Provider value={{ isPro, isLoading }}>
            {children}
        </UserStatusContext.Provider>
    );
};