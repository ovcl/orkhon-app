// next/image-д зориулсан хэмжээсүүдийг build үед урьдчилан үүсгэнэ (WebP).
//
// Яагаад: Vercel-ийн Image Optimization нь Hobby багцад сарын квоттой, бас Next.js-ийн
// эмзэг байдлуудын ихэнх нь яг энэ endpoint-д байдаг. Хэмжээсүүдийг build үед үүсгэж
// статик файлаар өгснөөр runtime боловсруулалт 0 болж, CDN-ээс шууд, хурдан ачаална.
//
// Эх зураг (public/images/**) ӨӨРЧЛӨГДӨХГҮЙ — зөвхөн дэлгэцийн хэмжээний хуулбар үүснэ
// (next/image өмнө нь яг ийм хуулбарыг on-the-fly үүсгэж байсан).
//
// Гаралт: public/_img/<өргөн>/<зам>.webp + app/data/image-manifest.json
// Кэш: node_modules/.cache/orkhon-img — дахин build хийхэд өөрчлөгдөөгүй зургийг алгасна
// (Vercel node_modules кэшийг build хооронд хадгалдаг).
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import imageWidths from '../lib/image-widths.js';

const { IMAGE_WIDTHS } = imageWidths;

const SOURCES = ['public/images/sites', 'public/hero.jpg', 'public/logo.png'];
const OUT_DIR = 'public/_img';
const CACHE_DIR = 'node_modules/.cache/orkhon-img';
const MANIFEST = 'app/data/image-manifest.json';
const QUALITY = 82;
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function collect(path, out = []) {
    if (!existsSync(path)) return out;
    if (statSync(path).isDirectory()) {
        for (const name of readdirSync(path)) collect(join(path, name), out);
    } else if (EXTENSIONS.has(extname(path).toLowerCase())) {
        out.push(path);
    }
    return out;
}

const toUrl = (file) => '/' + relative('public', file).split(sep).join('/');
const outRel = (url, width) => `${width}${url.replace(/\.[^.]+$/, '')}.webp`;

async function processImage(file) {
    const url = toUrl(file);
    const { size, mtimeMs } = statSync(file);
    const key = createHash('sha1').update(`${url}:${size}:${mtimeMs}:${QUALITY}:${IMAGE_WIDTHS.join(',')}`).digest('hex').slice(0, 12);
    const cacheBase = join(CACHE_DIR, key);

    if (!existsSync(join(cacheBase, '.done'))) {
        rmSync(cacheBase, { recursive: true, force: true });
        const input = sharp(file, { failOn: 'none' }).rotate();
        const { width: srcWidth } = await input.metadata();
        for (const width of IMAGE_WIDTHS) {
            const target = join(cacheBase, `${width}.webp`);
            mkdirSync(dirname(target), { recursive: true });
            await input
                .clone()
                .resize({ width: Math.min(width, srcWidth || width), withoutEnlargement: true })
                .webp({ quality: QUALITY, effort: 4 })
                .toFile(target);
        }
        writeFileSync(join(cacheBase, '.done'), '');
    }

    for (const width of IMAGE_WIDTHS) {
        const dest = join(OUT_DIR, outRel(url, width));
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(join(cacheBase, `${width}.webp`), dest);
    }
    return url;
}

const files = SOURCES.flatMap((s) => collect(s));
const started = Date.now();
rmSync(OUT_DIR, { recursive: true, force: true });

const queue = [...files];
const done = [];
const workers = Array.from({ length: Math.max(1, Math.min(4, os.cpus().length - 1)) }, async () => {
    while (queue.length) {
        const file = queue.shift();
        try {
            done.push(await processImage(file));
        } catch (err) {
            console.error(`build-images: ${file} — ${err.message}`);
            process.exitCode = 1;
        }
    }
});
await Promise.all(workers);

done.sort();
writeFileSync(MANIFEST, JSON.stringify(done) + '\n');
console.log(`build-images: ${done.length} зураг × ${IMAGE_WIDTHS.length} хэмжээ (${((Date.now() - started) / 1000).toFixed(0)}с)`);
