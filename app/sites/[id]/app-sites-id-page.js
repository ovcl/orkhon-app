import { sitesData } from "../../data/sites";
import SiteDetailClient from "./SiteDetailClient";

// Site бүрт зориулсан SEO/Open Graph metadata — Facebook/Twitter-т хуваалцахад
// тухайн дурсгалын нэр/тайлбар/зураг зөв харагдана (өмнө нь бүх хуудас ижил
// ерөнхий meta ашигладаг байсан)
export async function generateMetadata({ params }) {
    const site = sitesData.find((s) => s.id.toString() === params.id);
    if (!site) {
        return { title: "Дурсгал олдсонгүй | ОВЦЛ" };
    }
    const description = (site.description || "").slice(0, 160);
    const image = site.images?.[0] || "/hero.jpg";

    return {
        title: `${site.name} | Орхоны хөндийн соёлын дурсгалт газар`,
        description,
        openGraph: {
            title: site.name,
            description,
            images: [{ url: image }],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: site.name,
            description,
            images: [image],
        },
    };
}

// Build-ийн үед бүх 32 site-ийн хуудсыг урьдчилан HTML болгож үүсгэнэ (SSG) —
// эхний ачаалалт хурдан, JS ажиллуулах хүлээх шаардлагагүй болно
export async function generateStaticParams() {
    return sitesData.map((site) => ({ id: site.id.toString() }));
}

export default function SiteDetailPage({ params }) {
    return <SiteDetailClient params={params} />;
}
