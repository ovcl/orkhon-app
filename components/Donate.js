'use client';

import { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { DONATION_QR } from '../lib/donation';

// QR-ыг агуулгаас нь тод SVG болгон үүсгэнэ (зургаас хуулахгүй — ямар ч хэмжээнд хурц)
function useQrSvg(text) {
    return useMemo(() => {
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createSvgTag({ cellSize: 6, margin: 3, scalable: true });
    }, [text]);
}

/** Хандивын QR + заавар. Мэдээллийн хуудас, киоск, цонх дотор адилхан. */
export function DonateContent({ t }) {
    const svg = useQrSvg(DONATION_QR);
    return (
        <div className="flex flex-col items-center text-center">
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">{t.donateText}</p>
            <div
                className="mt-4 w-52 h-52 rounded-2xl bg-white p-2 shadow-lg [&>svg]:w-full [&>svg]:h-full"
                role="img"
                aria-label={t.donateQrAlt}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p className="mt-3 text-xs text-slate-400 max-w-xs">{t.donateScan}</p>
            <p className="mt-2 text-sm font-semibold text-amber-400">{t.donateThanks}</p>
        </div>
    );
}

/** "❤️ Дэмжих" товч — дарахад QR бүхий цонх нээгдэнэ. */
export function DonateButton({ t, className = '' }) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={className}>
                <i className="fa-solid fa-heart text-rose-400" aria-hidden="true"></i>
                <span>{t.donateButton}</span>
            </button>
            {open && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t.donateTitle}
                        className="w-full max-w-sm rounded-2xl bg-navy/95 border border-white/10 p-5 text-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                                <i className="fa-solid fa-heart text-rose-400 text-base" aria-hidden="true"></i> {t.donateTitle}
                            </h3>
                            <button type="button" onClick={() => setOpen(false)} aria-label="✕" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        </div>
                        <DonateContent t={t} />
                    </div>
                </div>
            )}
        </>
    );
}
