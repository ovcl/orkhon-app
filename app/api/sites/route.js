import { NextResponse } from 'next/server';
import { sitesData } from '../../data/sites';
import { summarizeSite } from '../../../lib/site-summary';

// Нээлттэй read-only API: киоск, мэдээллийн самбар, гадны системд зориулав.
// GET /api/sites          → бүх дурсгалын хураангуй
// GET /api/sites/:id      → нэг дурсгалын бүрэн өгөгдөл
// GET /api/sites/geojson  → GeoJSON FeatureCollection (ArcGIS / QGIS-д шууд ачаална)
export const dynamic = 'force-static';

export async function GET() {
    return NextResponse.json({ count: sitesData.length, sites: sitesData.map(summarizeSite) });
}
