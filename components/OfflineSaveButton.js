'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
    downloadAssets,
    estimateBytes,
    formatBytes,
    isOfflineSupported,
    isSiteDownloaded,
    removeSite,
    requestPersistence,
    siteAssets,
} from '../lib/offline';

/** Нэг дурсгалын хуудас, зураг, панорама, 3D загварыг офлайн хадгалах товч. */
export default function OfflineSaveButton({ site, t }) {
    const [supported, setSupported] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | saving | saved | error
    const [progress, setProgress] = useState(0);
    const abortRef = useRef(null);

    const assets = siteAssets(site);
    const size = estimateBytes(assets);

    useEffect(() => {
        const ok = isOfflineSupported();
        setSupported(ok);
        if (ok) isSiteDownloaded(site).then((done) => done && setStatus('saved'));
        return () => abortRef.current?.abort();
    }, [site]);

    if (!supported) return null;

    const save = async () => {
        if (status === 'saving') {
            abortRef.current?.abort();
            setStatus('idle');
            return;
        }
        abortRef.current = new AbortController();
        setStatus('saving');
        setProgress(0);
        requestPersistence();
        const result = await downloadAssets(assets, {
            signal: abortRef.current.signal,
            onProgress: ({ done, total }) => setProgress(total ? done / total : 0),
        });
        if (abortRef.current.signal.aborted) return;
        setStatus(result.failed.length ? 'error' : 'saved');
    };

    const remove = async () => {
        await removeSite(site);
        setStatus('idle');
    };

    if (status === 'saved') {
        return (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                    {t.offlineSaved}
                </span>
                <button onClick={remove} className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2">
                    {t.offlineRemove}
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={save}
            aria-busy={status === 'saving'}
            className={clsx(
                'relative w-full overflow-hidden flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-colors',
                status === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
            )}
        >
            {status === 'saving' && (
                <span
                    className="absolute inset-y-0 left-0 bg-amber-500/15 transition-[width] duration-300"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                    aria-hidden="true"
                />
            )}
            <span className="relative flex items-center gap-2.5">
                <i
                    className={clsx(
                        'fa-solid text-sm',
                        status === 'saving' ? 'fa-circle-notch fa-spin text-amber-400' : 'fa-cloud-arrow-down text-amber-400'
                    )}
                    aria-hidden="true"
                ></i>
                <span className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                        {status === 'saving' ? `${t.offlineSaving} ${Math.round(progress * 100)}%` : t.offlineSave}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {status === 'error' ? t.offlineFailed : `≈ ${formatBytes(size)}`}
                    </span>
                </span>
            </span>
            {status === 'saving' && <span className="relative text-[11px] text-slate-300">{t.offlineCancel}</span>}
        </button>
    );
}
