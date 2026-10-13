import { createContext, useContext } from 'react';
import type { ToastAction } from '../components/Common/Toast/Toast';

interface ToastContextType {
    showSuccess: (title: string, message?: string, duration?: number, action?: ToastAction) => string;
    showError: (title: string, message?: string, duration?: number, action?: ToastAction) => string;
    showWarning: (title: string, message?: string, duration?: number, action?: ToastAction) => string;
    showInfo: (title: string, message?: string, duration?: number, action?: ToastAction) => string;
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
