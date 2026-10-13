// sites.js дахь бүх /images, /models зам public/-д ЯГ ижил нэрээр (том/жижиг үсэг хүртэл)
// байгаа эсэхийг шалгана. Windows үсгийн хэмжээг ялгадаггүй ч Vercel/Linux ялгадаг тул
// локалд ажиллаад production-д 404 өгөх алдааг build-ээс өмнө барина.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';

const source = readFileSync('app/data/sites.js', 'utf8');
const urls = [...new Set([...source.matchAll(/["'`](\/(?:images|models|sounds)\/[^"'`]+)["'`]/g)].map((m) => m[1]))];

const listings = new Map();
function existsExact(publicPath) {
    const full = join('public', publicPath);
    const dir = dirname(full);
    if (!listings.has(dir)) {
        try {
            listings.set(dir, new Set(readdirSync(dir)));
        } catch {
            listings.set(dir, new Set());
        }
    }
    return listings.get(dir).has(basename(full));
}

const missing = urls.filter((u) => !existsExact(decodeURI(u)));
const risky = urls.filter((u) => /[\s()]/.test(u));

if (risky.length) {
    console.warn(`check-media: ${risky.length} зам зай/хаалт агуулж байна (ажиллана, гэхдээ "_" болгохыг зөвлөе)`);
}
if (missing.length) {
    console.error(`check-media: ${missing.length} файл олдсонгүй (том/жижиг үсгийг шалга):`);
    missing.forEach((u) => console.error('  ✗', u));
    process.exit(1);
}
console.log(`check-media: ${urls.length} медиа зам бүгд OK`);
