import { NextResponse } from 'next/server';
import { sitesData } from '../../../data/sites';

export const dynamic = 'force-static';

export function generateStaticParams() {
    return sitesData.map((site) => ({ id: String(site.id) }));
}

export async function GET(_request, { params }) {
    const { id } = await params;
    const site = sitesData.find((s) => String(s.id) === id);
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    return NextResponse.json(site);
}
