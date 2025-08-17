import { createContext, useContext } from 'react';

interface ToastContextType {
    showSuccess: (title: string, message?: string, duration?: number) => string;
    showError: (title: string, message?: string, duration?: number) => string;
    showWarning: (title: string, message?: string, duration?: number) => string;
    showInfo: (title: string, message?: string, duration?: number) => string;
    dismissToast: (id: string) => void;
    clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastContext() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
}
