import React from 'react';
import { AnimatePresence } from 'motion/react';
import Toast, { type Toast as ToastType } from './Toast';
import './ToastContainer.scss';

interface ToastContainerProps {
    toasts: ToastType[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    const orderedToasts = [...toasts].sort((a, b) => {
        if (a.priority !== b.priority) {
            return b.priority - a.priority;
        }

        return b.createdAt - a.createdAt;
    });

    return (
        <div className="toast-container">
            <AnimatePresence mode="popLayout">
                {orderedToasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onDismiss={onDismiss}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
