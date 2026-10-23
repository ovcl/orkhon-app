'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import qrcode from 'qrcode-generator';

const IDLE_MS = (Number(process.env.NEXT_PUBLIC_KIOSK_IDLE_SECONDS) || 180) * 1000;
const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
const ZOOM_KEYS = new Set(['+', '=', '-', '_', '0']);

const QR_TEXT = {
    mn: { title: 'Утсаараа уншуулж нээнэ үү', note: 'Энэ холбоос киоск дээр нээгдэхгүй — утасныхаа камераар QR кодыг уншуулна уу.', close: 'Хаах' },
    en: { title: 'Scan to open on your phone', note: 'This link cannot be opened on the kiosk — scan the QR code with your phone camera.', close: 'Close' },
};

function isExternal(href) {
    try {
        const u = new URL(href, window.location.href);
        return u.origin !== window.location.origin || !/^https?:$/.test(u.protocol);
    } catch {
        return false;
    }
}

/**
 * Музейн киоск горим: `?kiosk=1`-ээр асааж, `?kiosk=0`-оор унтраана (төхөөрөмж дээр хадгалагдана).
 * - Идэвхгүй IDLE_MS хугацааны дараа нүүр хуудсыг монгол хэлээр дахин ачаална (бүх цонх, тур хаагдана).
 * - Гадаад холбоос (вэб, Google Maps, Quest) киоскийг орхиулахгүй — оронд нь QR код харуулна.
 * - Хуудас томруулах (Ctrl+дугуй, Ctrl +/−/0), баруун товчны цэс, текст сонголтыг хаана.
 */
export default function KioskMode() {
    const pathname = usePathname();
    const [enabled, setEnabled] = useState(false);
    const [qrHref, setQrHref] = useState(null);

    useEffect(() => {
        try {
            const param = new URLSearchParams(window.location.search).get('kiosk');
            if (param === '1') localStorage.setItem('kiosk', '1');
            if (param === '0') localStorage.removeItem('kiosk');
            setEnabled(localStorage.getItem('kiosk') === '1');
        } catch {}
    }, []);

    useEffect(() => {
        if (!enabled) return;
        document.documentElement.dataset.kiosk = 'true';

        // Гадаад холбоос → QR (capture үе шатанд, Next Link-ээс өмнө)
        const onClick = (e) => {
            const a = e.target.closest?.('a[href]');
            if (!a || !isExternal(a.href)) return;
            e.preventDefault();
            e.stopPropagation();
            setQrHref(a.href);
        };
        const origOpen = window.open;
        window.open = (url, ...rest) => {
            if (url && isExternal(String(url))) { setQrHref(new URL(String(url), window.location.href).href); return null; }
            return origOpen.call(window, url, ...rest);
        };
        // Хуудас томруулахыг хаана (газрын зураг, панорам өөрсдөө event-ээ хүлээн авсаар байна)
        const onWheel = (e) => { if (e.ctrlKey) e.preventDefault(); };
        const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && ZOOM_KEYS.has(e.key)) e.preventDefault(); };
        const blockMenu = (e) => e.preventDefault();

        document.addEventListener('click', onClick, true);
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKey);
        window.addEventListener('contextmenu', blockMenu);
        return () => {
            document.removeEventListener('click', onClick, true);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('contextmenu', blockMenu);
            window.open = origOpen;
        };
    }, [enabled]);

    // Идэвхгүй болоход нүүр хуудас руу. Хүн хэрэглээгүй бол нүүр хуудсыг давтан ачаалахгүй.
    useEffect(() => {
        if (!enabled) return;
        let timer;
        let used = pathname !== '/';
        const arm = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (!used) return;
                try {
                    localStorage.setItem('language', 'mn');
                    sessionStorage.clear();
                } catch {}
                window.location.replace('/');
            }, IDLE_MS);
        };
        const onActivity = () => { used = true; arm(); };
        arm();
        EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
        return () => {
            clearTimeout(timer);
            EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
        };
    }, [enabled, pathname]);

    if (!qrHref) return null;
    return <ExternalLinkQR href={qrHref} onClose={() => setQrHref(null)} />;
}

function ExternalLinkQR({ href, onClose }) {
    let lang = 'mn';
    try {
        const stored = localStorage.getItem('language');
        lang = !stored || stored === 'mn' ? 'mn' : 'en';
    } catch {}
    const t = QR_TEXT[lang];
    const qr = qrcode(0, 'M');
    qr.addData(href);
    qr.make();
    const svg = qr.createSvgTag({ cellSize: 6, margin: 3, scalable: true });
    let host = href;
    try { host = new URL(href).hostname.replace(/^www\./, ''); } catch {}

    return createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="w-full max-w-xs rounded-3xl bg-slate-900 border border-white/10 p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <i className="fa-solid fa-mobile-screen-button text-2xl text-amber-400 mb-2"></i>
                <h2 className="font-heading font-bold text-lg text-white mb-1">{t.title}</h2>
                <p className="text-xs text-slate-400 mb-4">{t.note}</p>
                <div className="mx-auto w-56 h-56 rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />
                <p className="mt-3 text-[11px] text-slate-500 break-all">{host}</p>
                <button onClick={onClose} className="mt-5 w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm">
                    {t.close}
                </button>
            </div>
        </div>,
        document.body
    );
}
