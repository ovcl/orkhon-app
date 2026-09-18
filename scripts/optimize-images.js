/**
 * optimize-images.js — public/images/sites болон public/images/panoramas
 * доторх бүх зургийг зохистой хэмжээ рүү багасгаж, sharpening нэмж
 * ЧАНАРЫГ САЙЖРУУЛНА (буурахгүй) — учир нь browser-ийн автомат downscale
 * hийхээс илүү, LANCZOS + unsharp mask ашигласан server-side resize
 * ЯЛГААТАЙ ТОД, ГЭГЭЭЛЭГ харагдана.
 *
 * ШИНЭ ФУНКЦҮҮД:
 * 1. Progressive JPEG — зураг аажмаар тодорч ачаалагдана (бүдэг→тод)
 * 2. WebP хувилбар — JPG-ийн хажууд .webp файл үүсгэнэ (30-40% бага)
 * 3. Панорама thumbnail — жижиг бүдэг placeholder (50-80KB), PanoramaViewer
 *    зураг ачаалж байх хооронд харуулна
 *
 * Ажиллуулах: node scripts/optimize-images.js
 * Шаардлагатай: npm install sharp (аль хэдийн package.json-д байгаа)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SITES_DIR = path.join(__dirname, '..', 'public', 'images', 'sites');
const PANO_DIR = path.join(__dirname, '..', 'public', 'images', 'panoramas');
const PANO_THUMBS_DIR = path.join(__dirname, '..', 'public', 'images', 'panoramas', 'thumbs');
const BACKUP_DIR = path.join(__dirname, '..', 'image-backup-original');

async function optimizeFolder(dir, maxWidth, quality, label, { createWebP = false, createThumbnail = false } = {}) {
    if (!fs.existsSync(dir)) {
        console.log(`Алгасав (олдсонгүй): ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    console.log(`\n=== ${label}: ${files.length} файл ===`);

    let totalBefore = 0;
    let totalAfter = 0;
    let totalWebP = 0;

    // Thumbnail хавтас үүсгэх
    if (createThumbnail && !fs.existsSync(PANO_THUMBS_DIR)) {
        fs.mkdirSync(PANO_THUMBS_DIR, { recursive: true });
    }

    for (const file of files) {
        const filePath = path.join(dir, file);
        const before = fs.statSync(filePath).size;
        totalBefore += before;

        // Эх хувийг нөөцлөх
        const backupSubdir = path.join(BACKUP_DIR, path.basename(dir));
        if (!fs.existsSync(backupSubdir)) fs.mkdirSync(backupSubdir, { recursive: true });
        const backupPath = path.join(backupSubdir, file);
        if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);

        // ========== 1. Progressive JPEG (чанар хэвээр, аажмаар тодрох) ==========
        const tempPath = filePath + '.tmp';
        await sharp(filePath)
            .resize({ width: maxWidth, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
            .sharpen({ sigma: 0.8, m1: 1.0, m2: 0.5 })
            .jpeg({
                quality,
                mozjpeg: true,
                chromaSubsampling: '4:4:4',
                progressive: true,  // ← ШИНЭ: бүдэг→тод аажмаар ачаалагдана
            })
            .toFile(tempPath);

        const after = fs.statSync(tempPath).size;
        totalAfter += after;
        fs.renameSync(tempPath, filePath);

        const savedPct = ((1 - after / before) * 100).toFixed(0);
        let logLine = `  ${file}: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB (-${savedPct}%)`;

        // ========== 2. WebP хувилбар (офлайн кэш-д зай хэмнэнэ) ==========
        if (createWebP) {
            const webpName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            const webpPath = path.join(dir, webpName);
            await sharp(filePath)
                .webp({ quality: Math.min(quality, 85), effort: 6 })
                .toFile(webpPath);
            const webpSize = fs.statSync(webpPath).size;
            totalWebP += webpSize;
            const webpSavedPct = ((1 - webpSize / after) * 100).toFixed(0);
            logLine += ` | WebP: ${(webpSize / 1024 / 1024).toFixed(1)}MB (-${webpSavedPct}%)`;
        }

        // ========== 3. Thumbnail (панорамад хүлээлгийн бүдэг зураг) ==========
        if (createThumbnail) {
            const thumbPath = path.join(PANO_THUMBS_DIR, file);
            await sharp(filePath)
                .resize({ width: 256, withoutEnlargement: true })
                .blur(2)
                .jpeg({ quality: 40, mozjpeg: true, progressive: true })
                .toFile(thumbPath);
            const thumbSize = fs.statSync(thumbPath).size;
            logLine += ` | Thumb: ${(thumbSize / 1024).toFixed(0)}KB`;
        }

        console.log(logLine);
    }

    console.log(`\n${label} JPEG нийт: ${(totalBefore / 1024 / 1024).toFixed(0)}MB -> ${(totalAfter / 1024 / 1024).toFixed(0)}MB`);
    if (createWebP) {
        console.log(`${label} WebP нийт: ${(totalWebP / 1024 / 1024).toFixed(0)}MB (кэш-д энийг ашиглавал ${((1 - totalWebP / totalAfter) * 100).toFixed(0)}% бага зай эзлэнэ)`);
    }
}

(async () => {
    console.log('Зургийн оновчлол эхэллээ (чанар САЙЖРУУЛАХ + офлайн оновчлол горим)...');
    console.log('Эх хувийг image-backup-original/-д хадгална.\n');

    // Site зургууд — WebP хувилбар үүсгэнэ
    await optimizeFolder(SITES_DIR, 2400, 90, 'Site зургууд', {
        createWebP: true,
    });

    // Панорама зургууд — WebP + thumbnail (бүдэг хүлээлгийн зураг) үүсгэнэ
    await optimizeFolder(PANO_DIR, 5120, 88, 'Панорама зургууд (360°)', {
        createWebP: true,
        createThumbnail: true,
    });

    console.log('\n✅ Дууслаа!');
    console.log('');
    console.log('Үүссэн файлууд:');
    console.log('  • *.jpg — Progressive JPEG (аажмаар тодрох, чанар хэвээр)');
    console.log('  • *.webp — WebP хувилбар (30-40% бага, офлайн кэш-д зай хэмнэнэ)');
    console.log('  • panoramas/thumbs/*.jpg — Бүдэг thumbnail (50-80KB, хүлээлгийн зураг)');
    console.log('');
    console.log('Шалгаад асуудалгүй бол: rm -rf image-backup-original');
    console.log('Асуудал гарвал image-backup-original/-с сэргээж болно.');
})();
