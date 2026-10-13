import { sitesData } from './data/sites';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap() {
    const pages = ['', '/sites', '/map', '/tours', '/info'].map((path) => ({
        url: `${siteUrl}${path}`,
        changeFrequency: 'monthly',
        priority: path === '' ? 1 : 0.8,
    }));
    const sites = sitesData.map((site) => ({
        url: `${siteUrl}/sites/${site.id}`,
        changeFrequency: 'yearly',
        priority: 0.6,
        images: site.images?.slice(0, 3).map((img) => `${siteUrl}${encodeURI(img)}`),
    }));
    return [...pages, ...sites];
}
