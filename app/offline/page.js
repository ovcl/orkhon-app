'use client';

import { useEffect, useState } from 'react';
import { sitesData } from '../data/sites';
import { downloadedSiteIds, isOfflineSupported } from '../../lib/offline';

// Service worker-ийн fallback хуудас: кэшлэгдээгүй хуудас руу офлайн орох үед харагдана.
// Энгийн <a> ашигласан — офлайн үед client navigation (RSC fetch) бүтэлгүйтдэг тул бүтэн хуудсаар ачаална.
export default function OfflinePage() {
    const [saved, setSaved] = useState([]);

    useEffect(() => {
        if (!isOfflineSupported()) return;
        downloadedSiteIds(sitesData).then((ids) => setSaved(sitesData.filter((s) => ids.includes(s.id))));
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-6 py-16">
            <div className="text-center max-w-sm w-full">
                <div className="w-20 h-20 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <i className="fa-solid fa-wifi text-3xl text-slate-500" aria-hidden="true"></i>
                </div>
                <h1 className="font-heading text-2xl font-bold text-white mb-3">Интернет холболтгүй</h1>
                <p className="text-slate-400 text-sm mb-2 leading-relaxed">
                    Энэ хуудас офлайн хадгалагдаагүй байна. Доорх татсан дурсгалууд интернэтгүй ажиллана.
                </p>
                <p className="text-slate-500 text-xs mb-8">
                    This page is not saved offline. Sites you downloaded are listed below.
                </p>

                {saved.length > 0 && (
                    <ul className="text-left space-y-2 mb-8">
                        {saved.map((site) => (
                            <li key={site.id}>
                                <a
                                    href={`/sites/${site.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/[0.04] hover:bg-white/[0.08] text-sm text-slate-200"
                                >
                                    <i className="fa-solid fa-circle-check text-emerald-400 text-xs" aria-hidden="true"></i>
                                    {site.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex flex-col gap-3">
                    <a href="/" className="btn btn-primary px-8 py-3 inline-flex items-center justify-center gap-2">
                        <i className="fa-solid fa-house" aria-hidden="true"></i>
                        Нүүр хуудас / Home
                    </a>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-secondary px-8 py-3 inline-flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-rotate-right" aria-hidden="true"></i>
                        Дахин оролдох / Retry
                    </button>
                </div>
            </div>
        </div>
    );
}
