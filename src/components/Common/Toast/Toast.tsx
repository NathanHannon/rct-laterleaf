import React from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Toast.scss';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: ToastAction;
    createdAt: number;
    priority: number;
}

interface ToastProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return faCheckCircle;
            case 'error':
                return faExclamationTriangle;
            case 'warning':
                return faExclamationTriangle;
            case 'info':
                return faInfoCircle;
            default:
                return faInfoCircle;
        }
    };

    return (
        <motion.div
            className={`toast toast-${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            layout
        >
            <div className="toast-icon">
                <FontAwesomeIcon icon={getIcon()} />
            </div>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
                {toast.action && (
                    <button
                        className="toast-action"
                        type="button"
                        onClick={() => {
                            toast.action!.onClick();
                            onDismiss(toast.id);
                        }}
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                className="toast-close"
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
            >
                <FontAwesomeIcon icon={faTimes} />
            </button>
        </motion.div>
    );
};

export default Toast;
