import { useContext } from 'react';
import { UserStatusContext } from '../context/userStatusContext';

export const useUserStatus = () => {
    const context = useContext(UserStatusContext);
    if (context === undefined) {
        throw new Error('useUserStatus must be used within a UserStatusProvider');
    }
    return context;
};