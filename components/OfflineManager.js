'use client';

import { useEffect, useRef, useState } from 'react';
import { sitesData } from '../app/data/sites';
import {
    clearOfflineContent,
    coreAssets,
    downloadAssets,
    downloadedSiteIds,
    estimateBytes,
    formatBytes,
    isOfflineSupported,
    mapAssets,
    requestPersistence,
    siteAssets,
    storageInfo,
} from '../lib/offline';

const ALL_ASSETS = [...coreAssets(), ...sitesData.flatMap(siteAssets)];
const ALL_BYTES = estimateBytes(ALL_ASSETS);

/** Бүх контент / газрын зургийг офлайн татах, зай харах, устгах самбар. */
export default function OfflineManager({ t }) {
    const [supported, setSupported] = useState(true);
    const [job, setJob] = useState(null); // { kind: 'all' | 'map', done, total }
    const [ready, setReady] = useState(0);
    const [storage, setStorage] = useState(null);
    const [message, setMessage] = useState('');
    const abortRef = useRef(null);

    const refresh = async () => {
        const [ids, info] = await Promise.all([downloadedSiteIds(sitesData), storageInfo()]);
        setReady(ids.length);
        setStorage(info);
    };

    useEffect(() => {
        const ok = isOfflineSupported();
        setSupported(ok);
        if (ok) refresh();
        return () => abortRef.current?.abort();
    }, []);

    if (!supported) {
        return <p className="text-xs text-slate-400">{t.offlineUnsupported}</p>;
    }

    const run = async (kind) => {
        if (job) {
            abortRef.current?.abort();
            setJob(null);
            return;
        }
        abortRef.current = new AbortController();
        setMessage('');
        setJob({ kind, done: 0, total: 0 });
        await requestPersistence();
        try {
            const urls = kind === 'map' ? await mapAssets() : ALL_ASSETS;
            const result = await downloadAssets(urls, {
                signal: abortRef.current.signal,
                concurrency: kind === 'map' ? 6 : 3,
                onProgress: ({ done, total }) => setJob({ kind, done, total }),
            });
            if (!abortRef.current.signal.aborted) {
                setMessage(result.failed.length ? `${t.offlineFailed} (${result.failed.length})` : t.offlineDone);
            }
        } catch {
            setMessage(t.offlineFailed);
        }
        setJob(null);
        refresh();
    };

    const clear = async () => {
        if (!window.confirm(t.offlineClearConfirm)) return;
        await clearOfflineContent();
        setMessage('');
        refresh();
    };

    const pct = job?.total ? Math.round((job.done / job.total) * 100) : 0;

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">{t.offlineIntro}</p>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/5 bg-black/20">
                    <div className="text-xl font-bold text-white">
                        {ready}
                        <span className="text-sm text-slate-500">/{sitesData.length}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{t.offlineSitesReady}</div>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-black/20">
                    <div className="text-xl font-bold text-white">{storage ? formatBytes(storage.usage) : '—'}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {t.offlineStorage}
                        {storage?.quota ? ` / ${formatBytes(storage.quota)}` : ''}
                    </div>
                </div>
            </div>

            {job && (
                <div aria-live="polite">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                        {t.offlineSaving} · {job.done}/{job.total || '…'} ({pct}%)
                    </p>
                </div>
            )}

            {message && !job && <p className="text-xs text-emerald-300" role="status">{message}</p>}

            <div className="grid gap-2">
                <button
                    onClick={() => run('all')}
                    disabled={job?.kind === 'map'}
                    className="btn btn-primary w-full disabled:opacity-40"
                >
                    <i className={`fa-solid ${job?.kind === 'all' ? 'fa-stop' : 'fa-cloud-arrow-down'}`} aria-hidden="true"></i>
                    {job?.kind === 'all' ? t.offlineCancel : `${t.offlineDownloadAll} (≈ ${formatBytes(ALL_BYTES)})`}
                </button>
                <button
                    onClick={() => run('map')}
                    disabled={job?.kind === 'all'}
                    className="btn btn-secondary w-full disabled:opacity-40"
                >
                    <i className={`fa-solid ${job?.kind === 'map' ? 'fa-stop' : 'fa-map'}`} aria-hidden="true"></i>
                    {job?.kind === 'map' ? t.offlineCancel : t.offlineDownloadMap}
                </button>
                <p className="text-[10px] text-slate-500 text-center">{t.offlineLargeWarning}</p>
                <button onClick={clear} disabled={Boolean(job)} className="text-[11px] text-slate-500 hover:text-red-400 underline underline-offset-2 disabled:opacity-40">
                    {t.offlineClear}
                </button>
            </div>
        </div>
    );
}
