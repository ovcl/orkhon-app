// Service worker (Serwist). Build үед public/sw.js болж compile хийгдэнэ — next.config.mjs.
// Кэшийн нэрс lib/offline.js-ийн CACHE_NAMES-тай ИЖИЛ байх ёстой: апп "Офлайн хадгалах"
// үед эдгээр кэш рүү шууд бичдэг.
import { defaultCache } from '@serwist/next/worker';
import {
    CacheFirst,
    CacheableResponsePlugin,
    ExpirationPlugin,
    NetworkOnly,
    RangeRequestsPlugin,
    Serwist,
    StaleWhileRevalidate,
} from 'serwist';

const MEDIA_IMAGES = 'media-images';
const IMG_WIDTH_PREFIX = /^\/_img\/\d+/;

const ok = new CacheableResponsePlugin({ statuses: [200] });

/**
 * next/image-ийн статик WebP хэмжээсүүд (/_img/<өргөн>/...). Кэшэд байвал шууд,
 * сүлжээгүй үед хүссэн өргөн байхгүй бол ижил зургийн хамгийн том кэшлэгдсэн өргөнийг буцаана.
 */
async function imageVariantHandler({ request, url }) {
    const cache = await caches.open(MEDIA_IMAGES);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    try {
        const res = await fetch(request);
        if (res.ok) await cache.put(request, res.clone());
        return res;
    } catch (err) {
        const tail = url.pathname.replace(IMG_WIDTH_PREFIX, '');
        const width = (u) => Number(new URL(u).pathname.split('/')[2]) || 0;
        const candidates = (await cache.keys())
            .filter((k) => new URL(k.url).pathname.replace(IMG_WIDTH_PREFIX, '') === tail)
            .sort((a, b) => width(b.url) - width(a.url));
        if (candidates.length) return cache.match(candidates[0]);
        throw err;
    }
}

const runtimeCaching = [
    // AI хөтөч, health — хэзээ ч кэшлэхгүй
    {
        matcher: ({ sameOrigin, url }) => sameOrigin && /^\/api\/(ai-guide|health|dev)/.test(url.pathname),
        handler: new NetworkOnly(),
    },
    {
        matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/_img/'),
        handler: imageVariantHandler,
    },
    // Эх зураг, панорама (Three.js шууд ачаална) — офлайн контент, хугацаагүй
    {
        matcher: ({ sameOrigin, url }) =>
            sameOrigin &&
            (url.pathname.startsWith('/images/') || url.pathname.startsWith('/_pano/') || /^\/(hero\.jpg|logo\.png)$/.test(url.pathname)),
        handler: new CacheFirst({ cacheName: MEDIA_IMAGES, plugins: [ok], matchOptions: { ignoreSearch: true } }),
    },
    // 3D загвар (.glb)
    {
        matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/models/'),
        handler: new CacheFirst({ cacheName: 'media-models', plugins: [ok] }),
    },
    // Дуу — <audio> Range request илгээдэг
    {
        matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/sounds/'),
        handler: new CacheFirst({ cacheName: 'media-audio', plugins: [ok, new RangeRequestsPlugin()] }),
    },
    // Газрын зураг (OpenFreeMap вектор, EOX хиймэл дагуул, AWS өндөршил) — үзсэн/татсан хэсэг офлайн ажиллана
    {
        matcher: ({ url }) =>
            /(^|\.)(openfreemap\.org|maps\.eox\.at|cartocdn\.com)$/i.test(url.hostname) ||
            url.href.startsWith('https://s3.amazonaws.com/elevation-tiles-prod/'),
        handler: new StaleWhileRevalidate({
            cacheName: 'map-tiles',
            plugins: [
                new CacheableResponsePlugin({ statuses: [0, 200] }),
                new ExpirationPlugin({ maxEntries: 8000, maxAgeSeconds: 60 * 60 * 24 * 60, purgeOnQuotaError: true }),
            ],
        }),
    },
    // Үлдсэн нь (хуудас, RSC, JS/CSS, фонт г.м.) — Serwist-ийн Next.js-д зориулсан default
    ...defaultCache,
];

// Windows дээр build хийхэд Serwist public файлын замыг "\"-тай үүсгэдэг тул "/" болгоно
// (засахгүй бол precache 404 өгч service worker суулгагдахгүй)
const manifest = (self.__SW_MANIFEST || []).map((e) => (typeof e === 'object' ? { ...e, url: e.url.replace(/\\/g, '/') } : e));

// /offline fallback хуудасны revision = build ID (_buildManifest.js-ийн зам /_next/static/<buildId>/...).
// Файлын агуулгын hash build хооронд ихэвчлэн өөрчлөгддөггүй тул revision болгоход хуучин HTML
// (устсан JS chunk-ийг заасан) precache-д үлдэж, офлайн үед "Application error" гардаг байв.
const buildManifestUrl = manifest.find((e) => typeof e === 'object' && e.url.endsWith('/_buildManifest.js'))?.url;
const buildRevision = buildManifestUrl?.split('/').slice(-2, -1)[0] || null;

const serwist = new Serwist({
    precacheEntries: [...manifest, { url: '/offline', revision: buildRevision }],
    precacheOptions: { cleanupOutdatedCaches: true },
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching,
    fallbacks: {
        entries: [
            {
                url: '/offline',
                matcher: ({ request }) => request.destination === 'document',
            },
        ],
    },
});

serwist.addEventListeners();

// Шинэ build идэвхжихэд кэшлэгдсэн HTML (офлайн хадгалсан хуудсууд ч) хуучин JS chunk-ийг заадаг —
// тэр chunk-ууд cleanupOutdatedCaches-аар устсан тул офлайн үед "Application error" гарна.
// Тиймээс хуудсуудыг шинэ build-ээр дахин татаж, татаж чадахгүйг устгана. RSC кэшийг бүрэн цэвэрлэнэ.
const PAGES_CACHE = 'pages';
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            await Promise.all(['pages-rsc', 'pages-rsc-prefetch'].map((name) => caches.delete(name)));
            const cache = await caches.open(PAGES_CACHE);
            const requests = await cache.keys();
            await Promise.all(
                requests.map(async (req) => {
                    try {
                        const res = await fetch(req.url, { cache: 'no-store', credentials: 'same-origin' });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const headers = new Headers(res.headers);
                        headers.delete('Vary'); // lib/offline.js-тэй адил — навигацийн хүсэлттэй таарна
                        await cache.put(req.url, new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers }));
                    } catch {
                        await cache.delete(req);
                    }
                })
            );
        })()
    );
});
