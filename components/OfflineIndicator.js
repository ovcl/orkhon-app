'use client';

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const updateStatus = () => {
            const offline = !navigator.onLine;
            setIsOffline(offline);
            if (offline) {
                setShow(true);
            } else {
                // Brief delay before hiding to show "back online" state
                setTimeout(() => setShow(false), 2000);
            }
        };

        updateStatus();
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
        };
    }, []);

    if (!show) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] text-center py-2 px-4 text-xs font-semibold tracking-wide transition-all duration-300"
            style={{
                background: isOffline
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : 'linear-gradient(90deg, #22c55e, #16a34a)',
                color: 'white',
                animation: 'slideDown 0.3s ease-out',
            }}
        >
            {isOffline ? (
                <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-wifi-slash text-[10px]"></i>
                    Офлайн горим / Offline Mode
                </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-check text-[10px]"></i>
                    Онлайн / Back Online
                </span>
            )}
        </div>
    );
}
