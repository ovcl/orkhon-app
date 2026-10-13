'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { LANGUAGES } from '../lib/i18n';

/**
 * Хэл сонгогч: товч дээр одоогийн хэлний богино код, дарахад 5 хэлний жагсаалт.
 * `className` — товчны гадаад төрх (хуудас бүрт өөр байж болно).
 */
export default function LanguageSwitcher({ language, onChange, className, align = 'right' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    useEffect(() => {
        if (!open) return;
        const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
        const esc = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', esc);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative pointer-events-auto">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Language: ${current.label}`}
                className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest border border-white/15 bg-black/50 backdrop-blur-md transition-colors hover:bg-black/70',
                    className
                )}
            >
                <i className="fa-solid fa-globe text-[10px] opacity-70" aria-hidden="true"></i>
                {current.short}
            </button>
            {open && (
                <ul
                    role="listbox"
                    aria-label="Language"
                    className={clsx(
                        'absolute top-full mt-2 z-[200] min-w-[150px] py-1.5 rounded-xl border border-white/10 bg-navy/95 backdrop-blur-lg shadow-2xl',
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                >
                    {LANGUAGES.map((l) => (
                        <li key={l.code} role="option" aria-selected={l.code === language}>
                            <button
                                type="button"
                                lang={l.htmlLang}
                                onClick={() => {
                                    onChange(l.code);
                                    setOpen(false);
                                }}
                                className={clsx(
                                    'w-full flex items-center justify-between gap-3 px-3.5 py-2 text-sm text-left transition-colors',
                                    l.code === language ? 'text-amber-400 font-semibold' : 'text-slate-200 hover:bg-white/5'
                                )}
                            >
                                <span>{l.label}</span>
                                <span className="text-[10px] text-slate-500 font-bold">{l.short}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
