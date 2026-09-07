/**
 * optimize-images.js — public/images/sites болон public/images/panoramas
 * доторх бүх зургийг зохистой хэмжээ рүү багасгаж, sharpening нэмж
 * ЧАНАРЫГ САЙЖРУУЛНА (буурахгүй) — учир нь browser-ийн автомат downscale
 * hийхээс илүү, LANCZOS + unsharp mask ашигласан server-side resize
 * ЯЛГААТАЙ ТОД, ГЭГЭЭЛЭГ харагдана.
 *
 * Ажиллуулах: node scripts/optimize-images.js
 * Шаардлагатай: npm install sharp (аль хэдийн package.json-д байгаа)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SITES_DIR = path.join(__dirname, '..', 'public', 'images', 'sites');
const PANO_DIR = path.join(__dirname, '..', 'public', 'images', 'panoramas');
const BACKUP_DIR = path.join(__dirname, '..', 'image-backup-original');

async function optimizeFolder(dir, maxWidth, quality, label) {
    if (!fs.existsSync(dir)) {
        console.log(`Алгасав (олдсонгүй): ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    console.log(`\n=== ${label}: ${files.length} файл ===`);

    let totalBefore = 0;
    let totalAfter = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        const before = fs.statSync(filePath).size;
        totalBefore += before;

        const backupSubdir = path.join(BACKUP_DIR, path.basename(dir));
        if (!fs.existsSync(backupSubdir)) fs.mkdirSync(backupSubdir, { recursive: true });
        const backupPath = path.join(backupSubdir, file);
        if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);

        const tempPath = filePath + '.tmp';
        await sharp(filePath)
            .resize({ width: maxWidth, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
            .sharpen({ sigma: 0.8, m1: 1.0, m2: 0.5 }) // browser-downscale-ээс илүү тод харагдуулна
            .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' }) // өнгөний нарийвчлал бүрэн хадгална
            .toFile(tempPath);

        const after = fs.statSync(tempPath).size;
        totalAfter += after;
        fs.renameSync(tempPath, filePath);

        const savedPct = ((1 - after / before) * 100).toFixed(0);
        console.log(`  ${file}: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB (-${savedPct}%)`);
    }

    console.log(`\n${label} нийт: ${(totalBefore / 1024 / 1024).toFixed(0)}MB -> ${(totalAfter / 1024 / 1024).toFixed(0)}MB`);
}

(async () => {
    console.log('Зургийн оновчлол эхэллээ (чанар САЙЖРУУЛАХ горим)... эх хувийг image-backup-original/-д хадгална');
    await optimizeFolder(SITES_DIR, 2400, 90, 'Site зургууд'); // retina дэлгэцэд ч тод
    await optimizeFolder(PANO_DIR, 5120, 88, 'Панорама зургууд (360°)'); // VR чанар дээшилсэн
    console.log('\nДууслаа! Шалгаад асуудалгүй бол:');
    console.log('  rm -rf image-backup-original');
    console.log('Асуудал гарвал image-backup-original/-с сэргээж болно.');
})();
