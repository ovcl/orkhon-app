// /api/sites* маршрутуудын нийтлэг хураангуй хэлбэр
export function summarizeSite(site) {
    return {
        id: site.id,
        name: site.name,
        nameEn: site.nameEn,
        category: site.category,
        protectionStatus: site.protectionStatus || null,
        location: site.location,
        image: site.images?.[0] || null,
        panoramas: site.panoramaTour?.length || 0,
        model3d: site.model3d || null,
        url: `/sites/${site.id}`,
    };
}
