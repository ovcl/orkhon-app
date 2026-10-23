// VR аяллын дурсгалын жагсаалт. Газрын зураг, дурсгалын жагсаалтад тусдаа байгаа зарим
// дурсгалыг аялалд нэг дурсгал болгон нэгтгэнэ (жишээ нь Хархорумын дөрвөн чулуун яст мэлхий).
import { siteTranslations } from '../app/data/sites-i18n';

const LANGS = ['mn', 'en', 'ko', 'zh', 'ru'];

const MERGES = [
    {
        // Дараалал: Хархорум хотын туурь, Мэлхийт толгой, Тариан талбай, Бага элстэй
        ids: [28, 29, 30, 27],
        name: 'Чулуун яст мэлхий дурсгал',
        i18n: {
            en: 'Stone turtle monuments',
            ko: '돌거북 유적',
            zh: '石龟遗迹',
            ru: 'Каменные черепахи',
        },
        // Яст мэлхий бүрийн нэр — харагдацын нэр, "Дэлгэрэнгүй"-н гарчиг болно
        titles: {
            28: {
                mn: 'Хархорум хотын туурь дахь чулуун яст мэлхий дурсгал',
                en: 'Stone turtle at the Kharkhorum city ruins',
                ko: '하라호름 도시 유적의 돌거북',
                zh: '哈拉和林古城遗址石龟',
                ru: 'Каменная черепаха на руинах Каракорума',
            },
            29: {
                mn: 'Мэлхийт толгойн ордны туурь дахь чулуун яст мэлхий дурсгал',
                en: 'Stone turtle at the Melkhiit Tolgoi palace ruins',
                ko: '멜히트 톨고이 궁전 유적의 돌거북',
                zh: '梅勒希特托勒盖宫殿遗址石龟',
                ru: 'Каменная черепаха на руинах дворца Мэлхийт-Толгой',
            },
            30: {
                mn: 'Тариан талбайд орших чулуун яст мэлхий дурсгал',
                en: 'Stone turtle in the Tarian Talbai field',
            },
            27: {
                mn: 'Бага элстэйн чулуун яст мэлхий дурсгал',
                en: 'Baga Elstei stone turtle',
            },
        },
        // Өөрийн панорамгүй яст мэлхийд өөр дурсгалын панорамыг харуулна (`nodes` — аль харагдац)
        borrow: {
            29: { from: 18 },
        },
    },
];

const hasPanorama = (s) => Boolean(s.panoramaUrl || s.panoramaTour?.length);

function mergeSites(members, { name, i18n, titles = {}, borrow = {} }, sites) {
    const [first] = members;

    // Яст мэлхий бүрийн нэр, тайлбар хэл бүрээр
    const titleOf = (s, l) => titles[s.id]?.[l] || (l === 'mn' ? s.name : siteTranslations[s.id]?.[l]?.name || titles[s.id]?.en || s.nameEn || s.name);
    const textOf = (s, l) => (l === 'mn' ? s.description : siteTranslations[s.id]?.[l]?.description || s.descriptionEn || s.description);
    const infoOf = (s) => Object.fromEntries(LANGS.map((l) => [l, { title: titleOf(s, l), text: textOf(s, l) }]));

    // Дурсгалын нийт тайлбар: "1. Гарчиг" + тайлбар, яст мэлхий бүрээр
    const joined = (l) =>
        members
            .map((s, i) => (textOf(s, l) ? `${i + 1}. ${titleOf(s, l)}\n${textOf(s, l)}` : ''))
            .filter(Boolean)
            .join('\n\n');

    // Панорамуудыг нэг тур болгоно. Харагдац бүр `info`-гоор өөрийн яст мэлхийн мэдээллийг авч явна —
    // "Дэлгэрэнгүй" дарахад зөвхөн тухайн яст мэлхийн тайлбар гарна.
    const panoramaTour = [];
    for (const s of members) {
        const info = infoOf(s);
        const offset = panoramaTour.length;
        const own = (s.panoramaTour || []).map((node) => ({
            ...node,
            hotspots: (node.hotspots || []).map((h) => ({ ...h, targetIndex: h.targetIndex + offset })),
        }));
        const b = borrow[s.id];
        const src = b && sites.find((x) => x.id === b.from);
        // Өөр дурсгалын харагдацын hotspot-ууд энэ турт хамаарахгүй
        const borrowed = (src?.panoramaTour || [])
            .filter((_, i) => !b.nodes || b.nodes.includes(i))
            .map((node) => ({ ...node, hotspots: [] }));
        const nodes = [...own, ...borrowed];
        // Харагдац бүрийг яст мэлхийнх нь нэрээр: "… дурсгал", олон бол "… (2)"
        nodes.forEach((node, i) => {
            const suffix = nodes.length > 1 ? ` (${i + 1})` : '';
            panoramaTour.push({
                ...node,
                name: info.mn.title + suffix,
                group: info.mn.title,
                nameEn: info.en.title + suffix,
                ...Object.fromEntries(['ko', 'zh', 'ru'].map((l) => [`name_${l}`, info[l].title + suffix])),
                info,
            });
        });
    }

    return {
        ...first,
        name,
        nameEn: i18n.en,
        description: joined('mn'),
        descriptionEn: joined('en'),
        images: members.flatMap((s) => s.images || []),
        panoramaTour,
        mergedIds: members.map((s) => s.id),
        i18n: Object.fromEntries(['ko', 'zh', 'ru'].map((l) => [l, { name: i18n[l], description: joined(l) }])),
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
        if (members.some(hasPanorama) || Object.keys(merge.borrow || {}).length) out.push(mergeSites(members, merge, sites));
    }
    return out;
}

/** `?site=29` гэх мэт нэгтгэгдсэн дурсгалын id-г аяллын дурсгалын id руу хөрвүүлнэ. */
export function tourSiteId(id) {
    const merge = MERGES.find((m) => m.ids.includes(id));
    return merge ? merge.ids[0] : id;
}
