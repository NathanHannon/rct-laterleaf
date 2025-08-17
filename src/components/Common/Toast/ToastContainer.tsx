import React from 'react';
import { AnimatePresence } from 'motion/react';
import Toast, { type Toast as ToastType } from './Toast';
import './ToastContainer.scss';

interface ToastContainerProps {
    toasts: ToastType[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="toast-container">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
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
