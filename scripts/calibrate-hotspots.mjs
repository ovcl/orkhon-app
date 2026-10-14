// Hotspot (панорама доторх сум)-ын yaw/pitch-ийг дроны GPS-ээр бодит чиглэлд тохируулна.
//
// DJI дроны сферик панорамын зурган гол = XMP `drone-dji:GimbalYawDegree` чиглэл
// (нарны байрлалаар ±5° нарийвчлалтай шалгасан). Иймд A → B сумны yaw нь:
//   yaw = bearing(A, B) − GimbalYaw(A),   pitch = atan(Δөндөр / зай)
// GPS-гүй (газрын камер) панорама дээрх сумыг өөрчлөхгүй.
//
//   node scripts/calibrate-hotspots.mjs          → зөвхөн тайлан
//   node scripts/calibrate-hotspots.mjs --write  → app/data/sites.js-д бичнэ
import { readFileSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const SITES = 'app/data/sites.js';
// Сум хэт доош гарч харагдахгүй болох, тэнгэрт хөвөхөөс сэргийлнэ
const PITCH_MIN = -35;
const PITCH_MAX = -4;
// Үүнээс ойр бол (бараг нэг цэг) чиглэл утгагүй тул гараар тавьсныг хэвээр үлдээнэ
const MIN_DIST_M = 8;
// Барилгын доторх зурагт GPS 0,0 гэх мэт буруу утга байдаг — Монголын хүрээнээс гадуурхыг үл тооно
const inMongolia = ({ lat, lon }) => lat > 41 && lat < 52.5 && lon > 87 && lon < 120;

// XMP нь JPEG-ийн эхний ~100KB дотор байдаг
function droneMeta(url) {
    const file = path.join('public', url);
    let buf;
    try {
        const fd = openSync(file, 'r');
        buf = Buffer.alloc(256 * 1024);
        const n = readSync(fd, buf, 0, buf.length, 0);
        closeSync(fd);
        buf = buf.subarray(0, n).toString('latin1');
    } catch {
        return null;
    }
    const get = (k) => {
        const m = buf.match(new RegExp(`drone-dji:${k}="([^"]+)"`));
        return m ? Number(m[1]) : null;
    };
    const lat = get('GpsLatitude');
    const lon = get('GpsLongitude');
    const alt = get('AbsoluteAltitude');
    const yaw = get('GimbalYawDegree');
    const rel = get('RelativeAltitude') ?? 0;
    if ([lat, lon, alt, yaw].some((v) => v == null || Number.isNaN(v))) return null;
    if (!inMongolia({ lat, lon })) return null;
    // ground = хөөрсөн цэгийн өндөр ≈ тухайн газрын гадаргуу
    return { lat, lon, alt, yaw, ground: alt - rel };
}

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function bearingAndDistance(a, b) {
    const φ1 = rad(a.lat);
    const φ2 = rad(b.lat);
    const Δλ = rad(b.lon - a.lon);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const bearing = (deg(Math.atan2(y, x)) + 360) % 360;
    const Δφ = φ2 - φ1;
    const h = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const dist = 2 * 6371000 * Math.asin(Math.sqrt(h));
    return { bearing, dist };
}

// sites.js доторх "panoramaTour": [...] массивуудыг олно (JSON хэлбэртэй бичигдсэн)
function arraySpan(text, open) {
    let depth = 0;
    let inStr = false;
    for (let j = open; j < text.length; j++) {
        const ch = text[j];
        if (inStr) {
            if (ch === '\\') j++;
            else if (ch === '"') inStr = false;
        } else if (ch === '"') inStr = true;
        else if (ch === '[') depth++;
        else if (ch === ']' && --depth === 0) return j + 1;
    }
    throw new Error('unterminated array');
}

let src = readFileSync(SITES, 'utf8');
const KEY = '"panoramaTour": ';
const rows = [];
let changed = 0;
let skipped = 0;
let from = 0;

for (;;) {
    const k = src.indexOf(KEY, from);
    if (k === -1) break;
    const open = k + KEY.length;
    const end = arraySpan(src, open);
    const raw = src.slice(open, end);
    const tour = JSON.parse(raw);
    let touched = false;

    tour.forEach((node) => {
        const a = droneMeta(node.url);
        for (const h of node.hotspots || []) {
            const target = tour[h.targetIndex];
            const b = target && droneMeta(target.url);
            if (!a || !b) {
                skipped++;
                rows.push([node.name, '→', target?.name ?? '?', 'GPS байхгүй — өөрчлөхгүй']);
                continue;
            }
            const { bearing, dist } = bearingAndDistance(a, b);
            if (dist < MIN_DIST_M) {
                skipped++;
                rows.push([node.name, '→', target.name, `${dist.toFixed(1)}м — хэт ойр, өөрчлөхгүй`]);
                continue;
            }
            const yaw = Math.round(((bearing - a.yaw) % 360 + 360) % 360);
            // Сумыг дараагийн цэгийн газар дээр (Street View шиг) байрлуулна
            const pitchRaw = deg(Math.atan2(b.ground - a.alt, dist));
            const pitch = Math.round(Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitchRaw)));
            rows.push([node.name, '→', target.name, `${Math.round(dist)}м, зүг ${Math.round(bearing)}°`, `yaw ${h.yaw}→${yaw}`, `pitch ${h.pitch}→${pitch}`]);
            if (h.yaw !== yaw || h.pitch !== pitch) {
                h.yaw = yaw;
                h.pitch = pitch;
                touched = true;
                changed++;
            }
        }
    });

    if (touched) {
        // Форматыг хадгалахын тулд зөвхөн hotspot объектуудын yaw/pitch тоог солино.
        // Hotspot-ууд (targetIndex-тэй объект) текстэд массивын дарааллаар байрладаг.
        const hotspots = tour.flatMap((n) => n.hotspots || []);
        let hi = 0;
        const patched = raw.replace(/\{[^{}]*"targetIndex"[^{}]*\}/g, (obj) => {
            const h = hotspots[hi++];
            return obj.replace(/("yaw":\s*)-?[\d.]+/, `$1${h.yaw}`).replace(/("pitch":\s*)-?[\d.]+/, `$1${h.pitch}`);
        });
        if (hi !== hotspots.length) throw new Error(`hotspot тоо таарахгүй: ${hi} / ${hotspots.length}`);
        src = src.slice(0, open) + patched + src.slice(end);
        from = open + patched.length;
    } else {
        from = end;
    }
}

for (const r of rows) console.log(r.join('  '));
console.log(`\nөөрчлөгдөх: ${changed}, алгассан (GPS-гүй / хэт ойр): ${skipped}`);
if (WRITE) {
    writeFileSync(SITES, src);
    console.log(`${SITES} шинэчлэгдлээ`);
}
