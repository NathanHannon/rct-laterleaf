import { type ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Common/Toast/ToastContainer';
import { ToastContext } from './toastContextUtils';

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const {
        toasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        dismissToast,
        clearToasts
    } = useToast();

    return (
        <ToastContext.Provider value={{
            showSuccess,
            showError,
            showWarning,
            showInfo,
            dismissToast,
            clearToasts
        }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}

export { useToast };
