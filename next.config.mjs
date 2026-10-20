import withSerwistInit from '@serwist/next';
import imageWidths from './lib/image-widths.js';

const { IMAGE_SIZES, DEVICE_SIZES } = imageWidths;

// Service worker: app/sw.js → public/sw.js (кэшийн дүрмүүд тэнд)
const withSerwist = withSerwistInit({
    swSrc: 'app/sw.js',
    swDest: 'public/sw.js',
    disable: process.env.NODE_ENV === 'development',
    cacheOnNavigation: true,
    reloadOnOnline: false,
    // Install үед зөвхөн жижиг, заавал хэрэгтэй файлуудыг precache хийнэ. Том медиаг
    // (images/, _img/, models/, sounds/) хэрэглэгч "Офлайн хадгалах"-аар сонгож татна.
    globPublicPatterns: ['logo.png', 'hero.jpg', 'manifest.json', 'maplibre/**/*'],
    // /offline fallback хуудсыг app/sw.js өөрөө precache-д нэмнэ (additionalPrecacheEntries нь
    // globPublicPatterns-ыг бүрэн дардаг тул энд ашиглахгүй)
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

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    // Локал production шалгалт (`npm run preview`) dev серверийн .next-ийг эвдэхгүйн тулд тусдаа фолдерт
    distDir: process.env.NEXT_DIST_DIR || '.next',
    // `*.dev.js` файлууд (hotspot редактор) зөвхөн dev горимд маршрут болно
    pageExtensions: process.env.NODE_ENV === 'development' ? ['dev.js', 'js', 'jsx'] : ['js', 'jsx'],
    // Docker / офлайн киоск серверт зориулсан бие даасан build (Vercel үүнийг үл тооно)
    output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
    images: {
        // Runtime боловсруулалт хийхгүй: хэмжээсүүд build үед үүснэ (scripts/build-images.mjs).
        // Vercel Image Optimization квот хэрэглэгдэхгүй, /_next/image endpoint ашиглагдахгүй.
        loader: 'custom',
        loaderFile: './lib/image-loader.js',
        imageSizes: IMAGE_SIZES,
        deviceSizes: DEVICE_SIZES,
    },
    async headers() {
        return [
            { source: '/:path*', headers: securityHeaders },
            {
                // Статик медиа — 7 хоног browser/CDN кэш, дараа нь дахин шалгана
                source: '/:dir(_img|images|models|sounds)/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
            },
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

export default withSerwist(nextConfig);
