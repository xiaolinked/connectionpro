import React from 'react';
import { useToast, TOAST_TYPES } from '../../context/ToastContext';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
    [TOAST_TYPES.SUCCESS]: CheckCircle,
    [TOAST_TYPES.ERROR]: XCircle,
    [TOAST_TYPES.INFO]: Info,
    [TOAST_TYPES.WARNING]: AlertTriangle,
};

export default function Toast() {
    const { toast, hideToast } = useToast();

    if (!toast) return null;

    const Icon = icons[toast.type] || Info;

    return (
        <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
            <div className="toast-content">
                <Icon className="toast-icon" size={20} />
                <span className="toast-message">{toast.message}</span>
            </div>
            <button
                className="toast-close"
                onClick={hideToast}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    );
}
