'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Дурсгалын тухай AI хөтөч. /api/ai-guide тохируулагдаагүй (OPENAI_API_KEY байхгүй)
 * эсвэл офлайн үед харагдахгүй / анхааруулга харуулна.
 */
export default function AIGuide({ siteId, language, t }) {
    const [enabled, setEnabled] = useState(false);
    const [online, setOnline] = useState(true);
    const [messages, setMessages] = useState([]); // { role: 'user' | 'guide' | 'error', text }
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/ai-guide')
            .then((r) => (r.ok ? r.json() : { enabled: false }))
            .then((d) => !cancelled && setEnabled(Boolean(d.enabled)))
            .catch(() => {});
        const update = () => setOnline(navigator.onLine);
        update();
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            cancelled = true;
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    useEffect(() => {
        setMessages([]);
    }, [siteId, language]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, loading]);

    if (!enabled) return null;

    const ask = async (text) => {
        if (loading) return;
        const q = text?.trim() || '';
        setLoading(true);
        setMessages((m) => [...m, { role: 'user', text: q || t.aiGuideIntro }]);
        setQuestion('');
        try {
            const res = await fetch('/api/ai-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId, language, question: q || undefined }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(res.status === 429 ? t.aiGuideRateLimit : t.aiGuideError);
            setMessages((m) => [...m, { role: 'guide', text: data.response }]);
        } catch (err) {
            setMessages((m) => [...m, { role: 'error', text: err.message || t.aiGuideError }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="mt-7" aria-labelledby="ai-guide-title">
            <h3 id="ai-guide-title" className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full block"></span>
                {t.aiGuideTitle}
            </h3>

            <div className="rounded-2xl border border-white/6 p-4" style={{ background: 'rgba(16,24,48,0.5)' }}>
                {!online ? (
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                        <i className="fa-solid fa-wifi text-slate-500" aria-hidden="true"></i>
                        {t.aiGuideOffline}
                    </p>
                ) : (
                    <>
                        {messages.length > 0 && (
                            <div className="space-y-3 mb-4 max-h-[360px] overflow-y-auto pr-1" aria-live="polite">
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={
                                            m.role === 'user'
                                                ? 'ml-8 text-right'
                                                : 'mr-4'
                                        }
                                    >
                                        <p
                                            className={
                                                m.role === 'user'
                                                    ? 'inline-block px-3 py-2 rounded-2xl rounded-br-md bg-amber-500/90 text-slate-900 text-xs font-medium'
                                                    : m.role === 'error'
                                                      ? 'px-3 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs'
                                                      : 'px-3 py-2.5 rounded-2xl rounded-bl-md bg-white/[0.06] text-slate-200 text-sm leading-relaxed whitespace-pre-line'
                                            }
                                        >
                                            {m.text}
                                        </p>
                                    </div>
                                ))}
                                {loading && (
                                    <p className="text-xs text-slate-400 flex items-center gap-2">
                                        <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
                                        {t.aiGuideThinking}
                                    </p>
                                )}
                                <div ref={endRef} />
                            </div>
                        )}

                        {messages.length === 0 && (
                            <button
                                onClick={() => ask('')}
                                disabled={loading}
                                className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/10 transition-colors"
                            >
                                <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
                                {t.aiGuideIntro}
                            </button>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (question.trim()) ask(question);
                            }}
                            className="flex gap-2"
                        >
                            <label htmlFor="ai-guide-question" className="sr-only">
                                {t.aiGuidePlaceholder}
                            </label>
                            <input
                                id="ai-guide-question"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                maxLength={500}
                                placeholder={t.aiGuidePlaceholder}
                                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                            />
                            <button
                                type="submit"
                                disabled={loading || !question.trim()}
                                aria-label={t.aiGuideAsk}
                                className="px-4 rounded-xl bg-amber-500 text-slate-900 text-sm font-bold disabled:opacity-40"
                            >
                                <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                            </button>
                        </form>
                        <p className="mt-3 text-[10px] text-slate-500 leading-snug">{t.aiGuideDisclaimer}</p>
                    </>
                )}
            </div>
        </section>
    );
}
