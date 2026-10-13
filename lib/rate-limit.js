// Энгийн in-memory rate limiter (sliding window).
// Нэг серверийн process дотор ажиллана — Vercel дээр instance бүр тусдаа тоолно,
// киоск/Docker серверт бүрэн хүчинтэй. Илүү хатуу хязгаар хэрэгтэй бол Redis (Upstash) руу шилжүүлнэ.

const buckets = new Map();
const MAX_KEYS = 5000;

/**
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit(key, { limit, windowMs }) {
    const now = Date.now();
    const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

    if (hits.length >= limit) {
        buckets.set(key, hits);
        return { ok: false, remaining: 0, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
    }

    hits.push(now);
    buckets.set(key, hits);

    // Санах ой хэт өсөхөөс сэргийлж хамгийн хуучин түлхүүрүүдийг устгана
    if (buckets.size > MAX_KEYS) {
        const excess = buckets.size - MAX_KEYS;
        let i = 0;
        for (const k of buckets.keys()) {
            if (i++ >= excess) break;
            buckets.delete(k);
        }
    }

    return { ok: true, remaining: limit - hits.length, retryAfter: 0 };
}

export function clientIp(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'local';
}
