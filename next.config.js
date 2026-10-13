/** @type {import('next').NextConfig} */
const { runtimeCaching: defaultRuntimeCaching } = require('@ducanh2912/next-pwa');

// Медиа кэшийн нэрс — lib/offline.js-ийн CACHE_NAMES-тай ЗААВАЛ ижил байна.
const MEDIA_IMAGES = 'media-images';
const MEDIA_MODELS = 'media-models';
const MEDIA_AUDIO = 'media-audio';

// Default-оос бидний өөрсдөө зохицуулдаг (эсвэл хэрэггүй) дүрмүүдийг хасна.
const OVERRIDDEN = new Set([
    'google-fonts-webfonts',
    'google-fonts-stylesheets',
    'static-image-assets',
    'next-image',
    'static-audio-assets',
    'cross-origin',
]);

const runtimeCaching = [
    // Дурсгалын зураг, панорама (/images/**) — офлайн контент, хугацаагүй хадгална
    {
        urlPattern: ({ url, sameOrigin }) =>
            sameOrigin && (url.pathname.startsWith('/images/') || /^\/(hero\.jpg|logo\.png)$/.test(url.pathname)),
        handler: 'CacheFirst',
        options: {
            cacheName: MEDIA_IMAGES,
            cacheableResponse: { statuses: [200] },
            matchOptions: { ignoreSearch: true },
        },
    },
    // 3D загвар (.glb)
    {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/models/'),
        handler: 'CacheFirst',
        options: {
            cacheName: MEDIA_MODELS,
            cacheableResponse: { statuses: [200] },
        },
    },
    // Дуу — <audio> нь Range request илгээдэг
    {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/sounds/'),
        handler: 'CacheFirst',
        options: {
            cacheName: MEDIA_AUDIO,
            rangeRequests: true,
            cacheableResponse: { statuses: [200] },
        },
    },
    // next/image — кэшэд байвал шууд, сүлжээгүй үед эх зургийг (media-images) буцаана.
    // Энэ функц service worker руу сериалчлагддаг тул гадны хувьсагч ашиглаж БОЛОХГҮЙ.
    {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === '/_next/image',
        handler: async ({ request, url }) => {
            const cache = await caches.open('next-image');
            const hit = await cache.match(request);
            if (hit) return hit;
            try {
                const res = await fetch(request);
                if (res.ok) await cache.put(request, res.clone());
                return res;
            } catch (err) {
                const original = url.searchParams.get('url');
                if (original) {
                    const raw = await caches.match(original, { ignoreSearch: true });
                    if (raw) return raw;
                    const keys = await cache.keys();
                    const other = keys.find((k) => new URL(k.url).searchParams.get('url') === original);
                    if (other) return cache.match(other);
                }
                throw err;
            }
        },
    },
    // Газрын зургийн суурь давхарга (CARTO) — үзсэн хэсэг офлайн ажиллана
    {
        urlPattern: /^https:\/\/([a-z0-9-]+\.)*cartocdn\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
            cacheName: 'map-tiles',
            expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 60, purgeOnQuotaError: true },
            cacheableResponse: { statuses: [0, 200] },
        },
    },
    ...defaultRuntimeCaching.filter((rule) => !OVERRIDDEN.has(rule.options?.cacheName)),
];

const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    register: true,
    disable: process.env.NODE_ENV === 'development',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: false,
    // Том медиаг install үед татахгүй — хэрэглэгч "Офлайн хадгалах"-аар сонгож татна.
    publicExcludes: ['!noprecache/**/*', '!images/**/*', '!models/**/*', '!sounds/**/*', '!unity-build/**/*'],
    fallbacks: {
        document: '/offline',
    },
    workboxOptions: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching,
    },
});

const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    {
        key: 'Permissions-Policy',
        // AR (камер), WebXR, төхөөрөмжийн мэдрэгч — зөвхөн өөрийн домэйнд
        value: 'camera=(self), microphone=(), geolocation=(self), xr-spatial-tracking=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)',
    },
];

const nextConfig = {
    poweredByHeader: false,
    // Docker / офлайн киоск серверт зориулсан бие даасан build (Vercel үүнийг үл тооно)
    output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
    images: {
        // Эх зураг маш том (~6MB) тул 4K хэмжээ үүсгэхгүй
        deviceSizes: [640, 828, 1080, 1200, 1920, 2048],
        minimumCacheTTL: 60 * 60 * 24 * 30,
    },
    async headers() {
        return [
            { source: '/:path*', headers: securityHeaders },
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Service-Worker-Allowed', value: '/' },
                ],
            },
        ];
    },
};

module.exports = withPWA(nextConfig);
