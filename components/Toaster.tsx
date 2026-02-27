"use client";

import { useEffect, useState } from "react";

type ToastProps = {
    message: string | null;
    onClose: () => void;
};

export default function Toaster({ message, onClose }: { message: string | null; onClose: () => void }) {
    if (!message) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '20vh',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--carrd-border)',
            color: 'white',
            padding: '0.8rem 1.5rem',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '1rem',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            animation: 'toastSlideUp 2.5s ease forwards'
        }}>
            {message}
        </div>
    );
}

export function useToast() {
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        // The animation is 2.5s, so we clear it shortly after
        setTimeout(() => {
            setToastMessage(prev => prev === msg ? null : prev);
        }, 2600);
    };

    return { toastMessage, showToast, clearToast: () => setToastMessage(null) };
}
