'use client';

import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import OfflineIndicator from './OfflineIndicator';
import KioskMode from './KioskMode';

// Dev горимд өмнөх production build-ийн service worker үлдвэл хуучин кэшээ
// өгч, өөрчлөлт харагдахгүй болдог. Тиймээс dev-д SW, кэшийг цэвэрлэнэ.
function useDevServiceWorkerCleanup() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development' || !('serviceWorker' in navigator)) return;
        (async () => {
            const regs = await navigator.serviceWorker.getRegistrations();
            if (!regs.length) return;
            await Promise.all(regs.map((r) => r.unregister()));
            if ('caches' in window) {
                await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
            }
            if (navigator.serviceWorker.controller) window.location.reload();
        })().catch(() => {});
    }, []);
}

// Апп даяарх client талын тохиргоо: хөдөлгөөн багасгах тохиргоог хүндэтгэх,
// сүлжээний төлөв, киоск горим.
export default function Providers({ children }) {
    useDevServiceWorkerCleanup();
    return (
        <MotionConfig reducedMotion="user">
            <OfflineIndicator />
            <KioskMode />
            {children}
        </MotionConfig>
    );
}
