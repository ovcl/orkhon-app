// Офлайн контент татах / шалгах / устгах — Cache Storage API.
// Кэшийн нэрс app/sw.js-ийн runtimeCaching-тэй ИЖИЛ байх ёстой: service worker
// эдгээр кэшээс шууд уншина.
import mediaSizes from '../app/data/media-manifest.json';
import { imageVariant } from './image-loader';
import { IMAGE_WIDTHS } from './image-widths';

export const CACHE_NAMES = {
    images: 'media-images',
    models: 'media-models',
    audio: 'media-audio',
    pages: 'pages',
    map: 'map-tiles',
};

const CORE_PAGES = ['/', '/sites', '/map', '/tours', '/info', '/offline'];
const AUDIO = ['/sounds/orkhon-valley.mp3'];

const MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
// Орхоны хөндийн хүрээ (lng/lat) ба татах zoom түвшин
const MAP_BOUNDS = { west: 101.9, east: 103.2, south: 46.65, north: 47.75 };
const MAP_MAX_ZOOM = 12;
const GLYPH_RANGES = ['0-255', '256-511', '1024-1279'];

export const isOfflineSupported = () =>
    typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator;

function cacheFor(url) {
    if (url.startsWith('/models/')) return CACHE_NAMES.models;
    if (url.startsWith('/sounds/')) return CACHE_NAMES.audio;
    if (url.startsWith('http')) return CACHE_NAMES.map;
    if (url.startsWith('/images/') || url.startsWith('/_img/') || url === '/hero.jpg' || url === '/logo.png') {
        return CACHE_NAMES.images;
    }
    return CACHE_NAMES.pages;
}

/** next/image-ийн бүх хэмжээс (статик WebP) — эх зургийг (≈6MB) биш эдгээрийг хадгална. */
function imageVariants(src) {
    return IMAGE_WIDTHS.map((w) => decodeURI(imageVariant(src, w)));
}

/** Нэг дурсгалд хамаарах бүх файл (хуудас, зураг, панорама, 3D загвар). */
export function siteAssets(site) {
    const urls = new Set([`/sites/${site.id}`]);
    (site.images || []).forEach((u) => imageVariants(u).forEach((v) => urls.add(v)));
    (site.panoramaTour || []).forEach((node) => {
        if (node.url) urls.add(node.url);
        (node.models3d || []).forEach((m) => m.url && urls.add(m.url));
    });
    if (site.panoramaUrl) urls.add(site.panoramaUrl);
    if (site.model3d) urls.add(site.model3d);
    return [...urls];
}

export function coreAssets() {
    return [...CORE_PAGES, ...imageVariants('/hero.jpg'), ...imageVariants('/logo.png'), '/logo.png', ...AUDIO];
}

/** Татахаас өмнөх тооцоолсон хэмжээ (байт) — хуудсууд тооцоонд орохгүй. */
export function estimateBytes(urls) {
    return urls.reduce((sum, u) => sum + (mediaSizes[u] || 0), 0);
}

export function formatBytes(bytes) {
    if (!bytes) return '0 MB';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

async function isCached(url) {
    const cache = await caches.open(cacheFor(url));
    return Boolean(await cache.match(url, { ignoreSearch: url.startsWith('/images/') || url.startsWith('/_img/') }));
}

/** Хуудасны HTML-ийг навигацийн хүсэлттэй таарахаар (Vary-гүй) хадгална. */
async function storeResponse(cache, url, res) {
    if (cacheFor(url) !== CACHE_NAMES.pages) return cache.put(url, res);
    const headers = new Headers(res.headers);
    headers.delete('Vary');
    const body = await res.blob();
    return cache.put(url, new Response(body, { status: res.status, statusText: res.statusText, headers }));
}

/** Сүлжээ тасалдах / CDN түр татгалзахад 2 удаа дахин оролдоно. */
async function fetchWithRetry(url, signal, attempts = 3) {
    for (let i = 1; ; i++) {
        try {
            const res = await fetch(url, { signal, mode: url.startsWith('http') ? 'cors' : 'same-origin' });
            if (res.ok) return res;
            if (res.status < 500 && res.status !== 429) throw new Error(`HTTP ${res.status}`);
            if (i >= attempts) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            if (signal?.aborted || i >= attempts || /^HTTP 4/.test(err.message)) throw err;
        }
        await new Promise((r) => setTimeout(r, 600 * i));
    }
}

/**
 * Файлуудыг кэшлэнэ. Аль хэдийн байгааг алгасна.
 * onProgress({ done, total, bytes, failed })
 */
export async function downloadAssets(urls, { onProgress, signal, concurrency = 4 } = {}) {
    const queue = [...new Set(urls)];
    const total = queue.length;
    let done = 0;
    let bytes = 0;
    const failed = [];

    const report = () => onProgress?.({ done, total, bytes, failed: failed.length });
    report();

    async function worker() {
        while (queue.length) {
            if (signal?.aborted) return;
            const url = queue.shift();
            try {
                if (!(await isCached(url))) {
                    const res = await fetchWithRetry(url, signal);
                    const len = Number(res.headers.get('content-length')) || mediaSizes[url] || 0;
                    const cache = await caches.open(cacheFor(url));
                    await storeResponse(cache, url, res);
                    bytes += len;
                }
            } catch (err) {
                if (signal?.aborted) return;
                failed.push(url);
            }
            done += 1;
            report();
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
    return { done, total, bytes, failed };
}

/** Дурсгалын бүх файл кэшэд байгаа эсэх. */
export async function isSiteDownloaded(site) {
    if (!isOfflineSupported()) return false;
    const checks = await Promise.all(siteAssets(site).map(isCached));
    return checks.every(Boolean);
}

/** Кэшэд байгаа дурсгалуудын id. */
export async function downloadedSiteIds(sites) {
    if (!isOfflineSupported()) return [];
    const results = await Promise.all(sites.map(async (s) => ((await isSiteDownloaded(s)) ? s.id : null)));
    return results.filter((id) => id !== null);
}

export async function removeSite(site) {
    await Promise.all(
        siteAssets(site).map(async (url) => {
            const cache = await caches.open(cacheFor(url));
            await cache.delete(url, { ignoreSearch: true });
        })
    );
}

// ---------- Газрын зургийн tile ----------

function lngToTile(lng, z) {
    return Math.floor(((lng + 180) / 360) * 2 ** z);
}
function latToTile(lat, z) {
    const r = (lat * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

/** Орхоны хөндийн хүрээний суурь зургийн tile, sprite, font-ийн URL-ууд. */
export async function mapAssets() {
    const urls = [MAP_STYLE_URL];
    const style = await fetch(MAP_STYLE_URL).then((r) => r.json());

    for (const source of Object.values(style.sources || {})) {
        if (source.type !== 'vector' || !source.url) continue;
        urls.push(source.url);
        const tilejson = await fetch(source.url).then((r) => r.json());
        const minZoom = tilejson.minzoom ?? 0;
        const maxZoom = Math.min(MAP_MAX_ZOOM, tilejson.maxzoom ?? MAP_MAX_ZOOM);
        const templates = tilejson.tiles || [];
        if (!templates.length) continue;
        for (let z = Math.max(minZoom, 5); z <= maxZoom; z++) {
            const x0 = lngToTile(MAP_BOUNDS.west, z);
            const x1 = lngToTile(MAP_BOUNDS.east, z);
            const y0 = latToTile(MAP_BOUNDS.north, z);
            const y1 = latToTile(MAP_BOUNDS.south, z);
            for (let x = x0; x <= x1; x++) {
                for (let y = y0; y <= y1; y++) {
                    // MapLibre subdomain-ыг (x + y) % n дүрмээр сонгодог — кэшийн URL таарах ёстой
                    const template = templates[(x + y) % templates.length];
                    urls.push(template.replace('{z}', z).replace('{x}', x).replace('{y}', y));
                }
            }
        }
    }

    if (style.sprite) {
        const sprites = Array.isArray(style.sprite) ? style.sprite.map((s) => s.url) : [style.sprite];
        for (const s of sprites) urls.push(`${s}.json`, `${s}.png`, `${s}@2x.json`, `${s}@2x.png`);
    }

    if (style.glyphs) {
        const stacks = new Set();
        for (const layer of style.layers || []) {
            const font = layer.layout?.['text-font'];
            if (Array.isArray(font)) stacks.add(font.join(','));
        }
        for (const stack of stacks) {
            for (const range of GLYPH_RANGES) {
                urls.push(style.glyphs.replace('{fontstack}', stack).replace('{range}', range));
            }
        }
    }
    return urls;
}

// ---------- Ерөнхий ----------

export async function storageInfo() {
    if (!navigator.storage?.estimate) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    return { usage, quota, persisted };
}

/** Браузер кэшийг автоматаар цэвэрлэхээс сэргийлэх хүсэлт. */
export async function requestPersistence() {
    try {
        return navigator.storage?.persist ? await navigator.storage.persist() : false;
    } catch {
        return false;
    }
}

export async function clearOfflineContent() {
    await Promise.all(Object.values(CACHE_NAMES).map((name) => caches.delete(name)));
    await caches.delete('next-image');
}
