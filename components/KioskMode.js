'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const IDLE_MS = (Number(process.env.NEXT_PUBLIC_KIOSK_IDLE_SECONDS) || 180) * 1000;
const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

/**
 * Музейн киоск горим: `?kiosk=1`-ээр асааж, `?kiosk=0`-оор унтраана (төхөөрөмж дээр хадгалагдана).
 * Идэвхгүй IDLE_MS хугацааны дараа нүүр хуудас руу буцаж, хэлийг монгол болгоно.
 */
export default function KioskMode() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let enabled = false;
        try {
            const param = new URLSearchParams(window.location.search).get('kiosk');
            if (param === '1') localStorage.setItem('kiosk', '1');
            if (param === '0') localStorage.removeItem('kiosk');
            enabled = localStorage.getItem('kiosk') === '1';
        } catch {}
        if (!enabled) return;

        document.documentElement.dataset.kiosk = 'true';
        let timer;
        const reset = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    localStorage.setItem('language', 'mn');
                } catch {}
                if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                if (pathname !== '/') router.push('/');
                else window.location.reload();
            }, IDLE_MS);
        };
        reset();
        EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
        const blockMenu = (e) => e.preventDefault();
        window.addEventListener('contextmenu', blockMenu);
        return () => {
            clearTimeout(timer);
            EVENTS.forEach((e) => window.removeEventListener(e, reset));
            window.removeEventListener('contextmenu', blockMenu);
        };
    }, [pathname, router]);

    return null;
}
