// public/ доторх офлайн медиа файлуудын хэмжээг app/data/media-manifest.json-д бичнэ.
// "Офлайн хадгалах" товч татахаас өмнө хэдэн MB болохыг харуулахад ашиглагдана.
// `npm run dev` / `npm run build`-ийн өмнө автоматаар ажиллана (predev/prebuild).
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const PUBLIC_DIR = 'public';
const MEDIA_DIRS = ['images', '_img', '_pano', 'models', 'sounds'];
const OUT_FILE = 'app/data/media-manifest.json';

function walk(dir, out) {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else out['/' + relative(PUBLIC_DIR, full).split(sep).join('/')] = statSync(full).size;
    }
    return out;
}

const sizes = {};
for (const dir of MEDIA_DIRS) walk(join(PUBLIC_DIR, dir), sizes);
for (const file of ['hero.jpg', 'logo.png']) {
    try {
        sizes['/' + file] = statSync(join(PUBLIC_DIR, file)).size;
    } catch {}
}

writeFileSync(OUT_FILE, JSON.stringify(sizes) + '\n');
const total = Object.values(sizes).reduce((a, b) => a + b, 0);
console.log(`media-manifest: ${Object.keys(sizes).length} файл, ${(total / 1024 / 1024).toFixed(0)} MB`);
