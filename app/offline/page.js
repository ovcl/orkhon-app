'use client';

import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-6">
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <i className="fa-solid fa-wifi text-3xl text-slate-500"></i>
                </div>
                <h1 className="font-heading text-2xl font-bold text-white mb-3">
                    Интернет холболтгүй
                </h1>
                <p className="text-slate-400 text-sm mb-2 leading-relaxed">
                    Энэ хуудас одоогоор ачаалах боломжгүй байна. Таны урьд нь зочилсон хуудсууд offline горимд ажиллах боломжтой.
                </p>
                <p className="text-slate-500 text-xs mb-8">
                    No internet connection. Previously visited pages may still be available offline.
                </p>
                <Link
                    href="/"
                    className="btn btn-primary px-8 py-3 inline-flex items-center gap-2"
                >
                    <i className="fa-solid fa-rotate-right"></i>
                    Дахин оролдох / Retry
                </Link>
            </div>
        </div>
    );
}
