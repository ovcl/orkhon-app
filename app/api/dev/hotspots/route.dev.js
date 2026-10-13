import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Зөвхөн `npm run dev` үед: /dev/hotspots редактороос нэг node-ийн hotspots массивыг
// app/data/sites.js файлд шууд бичнэ. `.dev.js` тул production build-д ордоггүй;
// NODE_ENV шалгалт нь нэмэлт хамгаалалт.
//
// Файлыг бүтнээр нь дахин бичихгүй — зөвхөн тухайн node-ийн "hotspots": [...] хэсгийг
// bracket-depth тоолж (string доторх хаалтыг алгасаж) солино. Regex-ээр nested массив
// устгах нь файлыг эвддэг (project-context bug pattern #4).

const SITES_FILE = path.join(process.cwd(), 'app', 'data', 'sites.js');
const isDev = process.env.NODE_ENV === 'development';

export async function POST(request) {
    if (!isDev) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { url, hotspots, nodeCount } = body || {};
    const error = validate(url, hotspots, nodeCount);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const source = await readFile(SITES_FILE, 'utf8');
    let updated;
    try {
        updated = replaceHotspots(source, url, hotspots);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 422 });
    }
    await writeFile(SITES_FILE, updated, 'utf8');
    return NextResponse.json({ ok: true });
}

function validate(url, hotspots, nodeCount) {
    if (typeof url !== 'string' || !url.startsWith('/images/panoramas/')) return 'url is invalid';
    if (!Array.isArray(hotspots)) return 'hotspots must be an array';
    for (const h of hotspots) {
        if (!Number.isFinite(h?.yaw) || h.yaw < 0 || h.yaw >= 360) return 'yaw must be 0–360';
        if (!Number.isFinite(h?.pitch) || h.pitch < -90 || h.pitch > 90) return 'pitch must be -90–90';
        if (!Number.isInteger(h?.targetIndex) || h.targetIndex < 0 || (nodeCount && h.targetIndex >= nodeCount)) {
            return 'targetIndex is out of range';
        }
        if (typeof h?.label !== 'string' || h.label.length > 60) return 'label must be a string (max 60)';
    }
    return null;
}

/** Хаалтын хос хайна — string literal доторх тэмдэгтийг алгасна. */
function findClosing(text, openIndex) {
    const open = text[openIndex];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    for (let i = openIndex; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (ch === '\\') i++;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') inString = true;
        else if (ch === open) depth++;
        else if (ch === close && --depth === 0) return i;
    }
    throw new Error('Unbalanced brackets in sites.js');
}

function replaceHotspots(source, url, hotspots) {
    const needle = `"url": ${JSON.stringify(url)}`;
    const at = source.indexOf(needle);
    if (at === -1) throw new Error(`Panorama not found in sites.js: ${url}`);
    if (source.indexOf(needle, at + needle.length) !== -1) throw new Error(`Panorama url is not unique: ${url}`);

    const keyAt = source.indexOf('"hotspots"', at);
    const nextUrlAt = source.indexOf('"url":', at + needle.length);
    if (keyAt === -1 || (nextUrlAt !== -1 && keyAt > nextUrlAt)) {
        throw new Error(`"hotspots" key not found for ${url}`);
    }
    const openAt = source.indexOf('[', keyAt);
    const closeAt = findClosing(source, openAt);

    const lineStart = source.lastIndexOf('\n', keyAt) + 1;
    const indent = source.slice(lineStart).match(/^[ \t]*/)[0];
    const items = hotspots.map(
        (h) =>
            `${indent}    { "yaw": ${round(h.yaw)}, "pitch": ${round(h.pitch)}, "targetIndex": ${h.targetIndex}, "label": ${JSON.stringify(h.label)} }`
    );
    const array = items.length ? `[\n${items.join(',\n')}\n${indent}]` : '[]';
    return source.slice(0, openAt) + array + source.slice(closeAt + 1);
}

const round = (n) => Math.round(n * 10) / 10;
