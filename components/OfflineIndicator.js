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
            className={`fixed top-0 left-0 right-0 z-[9999] text-center py-2 px-4 text-xs font-semibold tracking-wide text-white transition-all duration-300 animate-[slideDown_0.3s_ease-out] bg-gradient-to-r ${
                isOffline ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'
            }`}
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
