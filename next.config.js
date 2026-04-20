/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'unsplash-images',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
        {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'cloudinary-images',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                    statuses: [0, 200],
                },
            },
        },
        {
            urlPattern: /^https:\/\/orkhonvalley\.gov\.mn\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'orkhon-images',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                },
            },
        },
        {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'cdn-assets',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                },
            },
        },
        {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts',
                expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                },
            },
        },
        {
            urlPattern: /\/_next\/static\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'next-static',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                },
            },
        },
        {
            urlPattern: /\/_next\/image\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'next-images',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                },
            },
        },
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'static-images',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                },
            },
        },
        {
            urlPattern: /^https?:\/\/.*\//i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 10,
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 60 * 60 * 24 * 7,
                },
            },
        },
    ],
    fallbacks: {
        document: '/offline',
    },
});

const nextConfig = {};

module.exports = withPWA(nextConfig);
