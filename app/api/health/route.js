import { NextResponse } from 'next/server';
import { sitesData } from '../../data/sites';
import pkg from '../../../package.json';

// Uptime мониторинг / киоск серверийн байдал шалгах
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(
        {
            status: 'ok',
            version: pkg.version,
            sites: sitesData.length,
            aiGuide: /^sk-/.test(process.env.OPENAI_API_KEY || ''),
            time: new Date().toISOString(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
