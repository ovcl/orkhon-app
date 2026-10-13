import { notFound } from 'next/navigation';
import { sitesData } from '../../data/sites';
import SiteDetailClient from '../SiteDetailClient';

// 32 дурсгалын хуудсыг build үед статикаар үүсгэнэ — хурдан, офлайн кэшлэхэд найдвартай
export const dynamicParams = false;

export function generateStaticParams() {
    return sitesData.map((site) => ({ id: String(site.id) }));
}

function findSite(id) {
    return sitesData.find((s) => String(s.id) === id);
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const site = findSite(id);
    if (!site) return {};
    const description = (site.description || '').replace(/\s+/g, ' ').slice(0, 160);
    const image = site.images?.[0];
    return {
        title: site.nameEn ? `${site.name} · ${site.nameEn}` : site.name,
        description,
        alternates: { canonical: `/sites/${site.id}` },
        openGraph: {
            title: site.name,
            description,
            type: 'article',
            images: image ? [{ url: image, alt: site.name }] : undefined,
        },
    };
}

export default async function SiteDetailPage({ params }) {
    const { id } = await params;
    const site = findSite(id);
    if (!site) notFound();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LandmarksOrHistoricalBuildings',
        name: site.name,
        alternateName: site.nameEn,
        description: site.descriptionEn || site.description,
        image: site.images?.[0],
        geo: site.location
            ? { '@type': 'GeoCoordinates', latitude: site.location.lat, longitude: site.location.lng }
            : undefined,
        containedInPlace: { '@type': 'LandmarksOrHistoricalBuildings', name: 'Orkhon Valley Cultural Landscape' },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
            />
            <SiteDetailClient siteId={site.id} />
        </>
    );
}
