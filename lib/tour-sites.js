// VR аяллын дурсгалын жагсаалт. Газрын зураг, дурсгалын жагсаалтад тусдаа байгаа зарим
// дурсгалыг аялалд нэг дурсгал болгон нэгтгэнэ (жишээ нь Хархорумын дөрвөн чулуун яст мэлхий).
import { siteTranslations } from '../app/data/sites-i18n';

const MERGES = [
    {
        ids: [27, 28, 29, 30],
        name: 'Чулуун яст мэлхий дурсгал',
        i18n: {
            en: 'Stone turtle monuments',
            ko: '돌거북 유적',
            zh: '石龟遗迹',
            ru: 'Каменные черепахи',
        },
        // 29-р яст мэлхий тусдаа панорамгүй — Мэлхийт толгойн ордны туурийн (18) панорамд харагддаг
        borrow: {
            29: {
                from: 18,
                name: { mn: 'Мэлхийт толгойн яст мэлхий', en: 'Melkhiit Tolgoi turtle', ko: '멜히트 톨고이 돌거북', zh: '梅勒希特托勒盖石龟', ru: 'Черепаха Мэлхийт-Толгой' },
            },
        },
    },
];

const hasPanorama = (s) => Boolean(s.panoramaUrl || s.panoramaTour?.length);

function mergeSites(members, { name, i18n, borrow = {} }, sites) {
    const [first] = members;
    // Тайлбар: дурсгал тус бүрийн нэр + тайлбар (VirtualTour, VR самбар мөр шилжилтийг хадгална)
    const join = (pick) =>
        members
            .map((s) => {
                const { title, text } = pick(s);
                return text ? `${title}\n${text}` : '';
            })
            .filter(Boolean)
            .join('\n\n');

    // Панорамуудыг нэг тур болгоно; hotspot-ын targetIndex-ийг шилжүүлнэ
    const panoramaTour = [];
    for (const s of members) {
        const offset = panoramaTour.length;
        for (const node of s.panoramaTour || []) {
            panoramaTour.push({ ...node, hotspots: (node.hotspots || []).map((h) => ({ ...h, targetIndex: h.targetIndex + offset })) });
        }
        // Өөр дурсгалын панорамыг энэ гишүүний харагдац болгон авна (тэр дурсгалын hotspot-ууд хамаарахгүй)
        const b = borrow[s.id];
        const src = b && sites.find((x) => x.id === b.from);
        (src?.panoramaTour || []).forEach((node, i, arr) => {
            const suffix = arr.length > 1 ? ` (${i + 1})` : '';
            panoramaTour.push({
                ...node,
                name: b.name.mn + suffix,
                group: b.name.mn,
                nameEn: b.name.en + suffix,
                ...Object.fromEntries(['ko', 'zh', 'ru'].map((l) => [`name_${l}`, b.name[l] + suffix])),
                hotspots: [],
            });
        });
    }

    const langs = Object.keys(i18n).filter((l) => l !== 'en');
    return {
        ...first,
        name,
        nameEn: i18n.en,
        description: join((s) => ({ title: s.name, text: s.description })),
        descriptionEn: join((s) => ({ title: s.nameEn || s.name, text: s.descriptionEn })),
        images: members.flatMap((s) => s.images || []),
        panoramaTour,
        mergedIds: members.map((s) => s.id),
        i18n: Object.fromEntries(
            langs.map((l) => [
                l,
                {
                    name: i18n[l],
                    description: join((s) => ({
                        title: siteTranslations[s.id]?.[l]?.name || s.nameEn || s.name,
                        text: siteTranslations[s.id]?.[l]?.description || s.descriptionEn,
                    })),
                },
            ])
        ),
    };
}

/** Аялалд харуулах дурсгалууд (панорамтай), нэгтгэсэн дурсгалуудыг эхний гишүүний байранд. */
export function buildTourSites(sites) {
    const out = [];
    for (const s of sites) {
        const merge = MERGES.find((m) => m.ids.includes(s.id));
        if (!merge) {
            if (hasPanorama(s)) out.push(s);
            continue;
        }
        if (s.id !== merge.ids[0]) continue;
        const members = merge.ids.map((id) => sites.find((x) => x.id === id)).filter(Boolean);
        if (members.some(hasPanorama)) out.push(mergeSites(members, merge, sites));
    }
    return out;
}

/** `?site=29` гэх мэт нэгтгэгдсэн дурсгалын id-г аяллын дурсгалын id руу хөрвүүлнэ. */
export function tourSiteId(id) {
    const merge = MERGES.find((m) => m.ids.includes(id));
    return merge ? merge.ids[0] : id;
}
