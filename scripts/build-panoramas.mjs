// Панорама бүрийн туслах файлууд (эх зураг ӨӨРЧЛӨГДӨХГҮЙ):
//   - preview: 2048×1024 WebP — VR харагч эхлээд үүнийг агшин зуур харуулж, бүрэн 8K зургийг
//     ард нь ачаална (удаан интернэтэд хар дэлгэц удаан харагдахгүй)
//   - thumb:   320×160 WebP — байршлын жагсаалтын эскиз
//   - lum:     дундаж гэрэлтүүлэг (0–255) — харагч харанхуй зургийг автоматаар гэрэлтүүлэхэд
//
// Гаралт: public/_pano/{preview,thumb}/<нэр>.webp + app/data/panorama-manifest.json
// Кэш: node_modules/.cache/orkhon-pano
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const SRC_DIR = 'public/images/panoramas';
const OUT_DIR = 'public/_pano';
const CACHE_DIR = 'node_modules/.cache/orkhon-pano';
const MANIFEST = 'app/data/panorama-manifest.json';
const VERSION = 'v1';

// URL-д аюулгүй, давтагдашгүй нэр (кирилл, зай, хаалтыг арилгана)
const safeName = (file) =>
    createHash('sha1').update(file).digest('hex').slice(0, 10) + '-' + file.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]+/g, '_').slice(0, 40);

async function processPanorama(file) {
    const src = join(SRC_DIR, file);
    const { size, mtimeMs } = statSync(src);
    const key = createHash('sha1').update(`${file}:${size}:${mtimeMs}:${VERSION}`).digest('hex').slice(0, 12);
    const cacheBase = join(CACHE_DIR, key);
    const name = safeName(file);

    if (!existsSync(join(cacheBase, 'meta.json'))) {
        rmSync(cacheBase, { recursive: true, force: true });
        mkdirSync(cacheBase, { recursive: true });
        const base = sharp(src, { failOn: 'none', limitInputPixels: false });
        await base.clone().resize(2048, 1024, { fit: 'fill' }).webp({ quality: 80 }).toFile(join(cacheBase, 'preview.webp'));
        await base.clone().resize(320, 160, { fit: 'fill' }).webp({ quality: 72 }).toFile(join(cacheBase, 'thumb.webp'));
        const stats = await base.clone().resize(512, 256, { fit: 'fill' }).stats();
        const [r, g, b] = stats.channels;
        const lum = Math.round(0.2126 * r.mean + 0.7152 * g.mean + 0.0722 * b.mean);
        writeFileSync(join(cacheBase, 'meta.json'), JSON.stringify({ lum }));
    }

    const { lum } = JSON.parse(readFileSync(join(cacheBase, 'meta.json'), 'utf8'));
    for (const kind of ['preview', 'thumb']) {
        mkdirSync(join(OUT_DIR, kind), { recursive: true });
        cpSync(join(cacheBase, `${kind}.webp`), join(OUT_DIR, kind, `${name}.webp`));
    }
    return [`/images/panoramas/${file}`, { lum, preview: `/_pano/preview/${name}.webp`, thumb: `/_pano/thumb/${name}.webp` }];
}

const started = Date.now();
const files = existsSync(SRC_DIR) ? readdirSync(SRC_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : [];
rmSync(OUT_DIR, { recursive: true, force: true });

const queue = [...files];
const manifest = {};
await Promise.all(
    Array.from({ length: Math.max(1, Math.min(3, os.cpus().length - 1)) }, async () => {
        while (queue.length) {
            const file = queue.shift();
            try {
                const [url, meta] = await processPanorama(file);
                manifest[url] = meta;
            } catch (err) {
                console.error(`build-panoramas: ${file} — ${err.message}`);
                process.exitCode = 1;
            }
        }
    })
);

writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort())) + '\n');
console.log(`build-panoramas: ${Object.keys(manifest).length} панорама (${((Date.now() - started) / 1000).toFixed(0)}с)`);
