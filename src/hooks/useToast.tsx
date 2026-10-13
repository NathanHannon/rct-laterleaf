import { useState, useCallback, useRef } from 'react';
import { type Toast, type ToastType, type ToastAction } from '../components/Common/Toast/Toast';

let toastIdCounter = 0;

const TOAST_PRIORITY: Record<ToastType, number> = {
    error: 3,
    warning: 2,
    success: 1,
    info: 0,
};

const TOAST_DEDUPE_WINDOW_MS = 1500;

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const recentToastSignatures = useRef<Map<string, { id: string; timestamp: number }>>(new Map());

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000, action?: ToastAction) => {
        const now = Date.now();
        const signature = `${type}|${title}|${message ?? ''}`;
        for (const [key, value] of recentToastSignatures.current.entries()) {
            if (now - value.timestamp > TOAST_DEDUPE_WINDOW_MS) {
                recentToastSignatures.current.delete(key);
            }
        }

        const recentToast = recentToastSignatures.current.get(signature);
        if (recentToast && now - recentToast.timestamp <= TOAST_DEDUPE_WINDOW_MS) {
            return recentToast.id;
        }

        const id = `toast-${++toastIdCounter}`;
        const toast: Toast = {
            id,
            type,
            title,
            message,
            duration,
            action,
            createdAt: now,
            priority: TOAST_PRIORITY[type],
        };

        setToasts(prev => [...prev, toast]);
        recentToastSignatures.current.set(signature, { id, timestamp: now });

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
        recentToastSignatures.current.clear();
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
