// Dev горимд Serwist унтраалттай ч өмнөх production build-ийн public/sw.js
// хөтөчид бүртгэлтэй үлдэж, хуучин кэшээ өгсөөр байдаг. Үүнийг өөрийгөө
// устгадаг SW-ээр солино; production build үед Serwist жинхэнэ sw.js-ээ дахин бичнэ.
import { writeFileSync } from 'node:fs';

writeFileSync(
    'public/sw.js',
    `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) await caches.delete(key);
        await self.registration.unregister();
        for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
    })());
});
`
);
console.log('dev-sw-reset: public/sw.js → өөрийгөө устгах SW');
