import { NextResponse } from 'next/server';
import { sitesData } from '../../../data/sites';
import { summarizeSite } from '../../../../lib/site-summary';

export const dynamic = 'force-static';

export async function GET() {
    const features = sitesData
        .filter((s) => typeof s.location?.lat === 'number' && typeof s.location?.lng === 'number')
        .map((site) => {
            const { location, ...properties } = summarizeSite(site);
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [location.lng, location.lat] },
                properties,
            };
        });
    return NextResponse.json(
        { type: 'FeatureCollection', features },
        { headers: { 'Content-Type': 'application/geo+json; charset=utf-8' } }
    );
}
