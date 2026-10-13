import { NextResponse } from 'next/server';
import { sitesData } from '../../data/sites';
import { rateLimit, clientIp } from '../../../lib/rate-limit';
import { LANGUAGES, isLanguage, siteName, siteDescription } from '../../../lib/i18n';

/**
 * AI хөтөч — дурсгалын тухай тайлбар, асуултад хариулна.
 *
 * GET  /api/ai-guide            → { enabled } (UI товч харуулах эсэх)
 * POST /api/ai-guide { siteId, question?, language? } → { response, cached }
 *
 * Env: OPENAI_API_KEY (заавал), OPENAI_MODEL (default gpt-4o-mini),
 *      AI_RATE_LIMIT_PER_MIN (default 8), AI_DAILY_LIMIT (default 500)
 */

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const PER_MINUTE = Number(process.env.AI_RATE_LIMIT_PER_MIN) || 8;
const DAILY = Number(process.env.AI_DAILY_LIMIT) || 500;
const MAX_QUESTION_LENGTH = 500;
const TIMEOUT_MS = 25_000;
const CACHE_LIMIT = 200;

const aiCache = new Map();

// .env.local.example-ийн placeholder утгыг тохируулаагүй гэж үзнэ
const isConfigured = () => /^sk-/.test(process.env.OPENAI_API_KEY || '');

export async function GET() {
    return NextResponse.json({ enabled: isConfigured() });
}

export async function POST(request) {
    if (!isConfigured()) {
        return NextResponse.json({ error: 'AI guide is not configured' }, { status: 503 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const siteId = Number.parseInt(body?.siteId, 10);
    const language = isLanguage(body?.language) ? body.language : 'mn';
    const question = typeof body?.question === 'string' ? body.question.trim() : '';

    if (!Number.isInteger(siteId)) {
        return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
        return NextResponse.json({ error: `Question is too long (max ${MAX_QUESTION_LENGTH})` }, { status: 400 });
    }

    const site = sitesData.find((s) => s.id === siteId);
    if (!site) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const cacheKey = `${siteId}_${language}`;
    if (!question && aiCache.has(cacheKey)) {
        return NextResponse.json({ response: aiCache.get(cacheKey), cached: true });
    }

    const perIp = rateLimit(`ip:${clientIp(request)}`, { limit: PER_MINUTE, windowMs: 60_000 });
    const global = perIp.ok ? rateLimit('global', { limit: DAILY, windowMs: 86_400_000 }) : perIp;
    if (!perIp.ok || !global.ok) {
        const retryAfter = (perIp.ok ? global : perIp).retryAfter;
        return NextResponse.json(
            { error: 'Too many requests', retryAfter },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    try {
        const response = await generate(site, question, language);
        if (!question) {
            if (aiCache.size >= CACHE_LIMIT) aiCache.delete(aiCache.keys().next().value);
            aiCache.set(cacheKey, response);
        }
        return NextResponse.json({ response, cached: false });
    } catch (error) {
        console.error('[ai-guide]', error);
        return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 502 });
    }
}

function siteContext(site, language) {
    const lines = [
        `Name: ${siteName(site, language)}`,
        `Mongolian name: ${site.name}`,
        site.nameEn ? `English name: ${site.nameEn}` : null,
        `Category: ${site.category}`,
        site.protectionStatus ? `Protection status: ${site.protectionStatus}` : null,
        site.location ? `Coordinates: ${site.location.lat}, ${site.location.lng}` : null,
        `Description: ${siteDescription(site, language)}`,
    ];
    const nodes = (site.panoramaTour || []).map((n) => n.name).filter(Boolean);
    if (nodes.length) lines.push(`Panorama viewpoints: ${nodes.join('; ')}`);
    return lines.filter(Boolean).join('\n');
}

async function generate(site, question, language) {
    const langName = LANGUAGES.find((l) => l.code === language)?.aiName || 'Mongolian (Cyrillic)';
    const system = [
        'You are the official virtual guide of the Orkhon Valley Cultural Landscape World Heritage property (UNESCO, inscribed 2004, criteria ii, iii, iv), managed by the Orkhon Valley Cultural Landscape administration in Kharkhorin, Mongolia.',
        'Ground every factual statement in the SITE DATA provided. You may add widely established general context about the Orkhon Valley, but never invent dates, measurements, inscriptions, names or legends.',
        'If the site data does not answer the question, say so plainly and suggest asking museum staff.',
        'Encourage respectful visiting: do not touch stelae or inscriptions, stay on paths, do not remove objects.',
        `Answer in ${langName}. Keep it concise: at most 3 short paragraphs, plain text without markdown headings.`,
    ].join(' ');

    const user = question
        ? `SITE DATA:\n${siteContext(site, language)}\n\nVisitor question: ${question}`
        : `SITE DATA:\n${siteContext(site, language)}\n\nGive visitors an engaging introduction to this site: its historical significance, cultural importance and what to look for on site.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                temperature: 0.4,
                max_tokens: 600,
            }),
        });

        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error('Empty response from OpenAI');
        return text;
    } finally {
        clearTimeout(timer);
    }
}
