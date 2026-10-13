// MapLibre 6 нь worker-ээ ES module (import.meta.url) хэлбэрээр ачаалдаг тул webpack bundle
// дотор зам нь эвдэрдэг. Worker болон түүний shared chunk-ийг public/maplibre/ руу хуулж,
// components/Map.js дотор setWorkerUrl('/maplibre/maplibre-gl-worker.mjs') гэж заана.
// Ингэснээр service worker үүнийг precache хийж газрын зураг офлайн ажиллана.
import { copyFileSync, mkdirSync } from 'node:fs';

const SRC = 'node_modules/maplibre-gl/dist';
const DEST = 'public/maplibre';
mkdirSync(DEST, { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
    copyFileSync(`${SRC}/${file}`, `${DEST}/${file}`);
}
console.log('maplibre worker → public/maplibre/');
