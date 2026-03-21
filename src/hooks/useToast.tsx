import { useState, useCallback } from 'react';
import { type Toast, type ToastType, type ToastAction } from '../components/Common/Toast/Toast';

let toastIdCounter = 0;

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000, action?: ToastAction) => {
        const id = `toast-${++toastIdCounter}`;
        const toast: Toast = { id, type, title, message, duration, action };

        setToasts(prev => [...prev, toast]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }

        return id;
    }, [dismissToast]);

    const showSuccess = useCallback((title: string, message?: string, duration?: number, action?: ToastAction) =>
        addToast('success', title, message, duration, action), [addToast]);

    const showError = useCallback((title: string, message?: string, duration?: number, action?: ToastAction) =>
        addToast('error', title, message, duration, action), [addToast]);

    const showWarning = useCallback((title: string, message?: string, duration?: number, action?: ToastAction) =>
        addToast('warning', title, message, duration, action), [addToast]);

    const showInfo = useCallback((title: string, message?: string, duration?: number, action?: ToastAction) =>
        addToast('info', title, message, duration, action), [addToast]);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        addToast,
        dismissToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearToasts
    };
};
