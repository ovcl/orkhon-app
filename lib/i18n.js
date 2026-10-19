// Олон хэлний туслах функцууд. Дэмжих хэл: mn, en, ko, zh, ru.
// Дурсгалын өгөгдөл: mn/en нь sites.js-д, ko/zh/ru нь app/data/sites-i18n.js-д.
// Орчуулга дутвал англи → монгол руу буцна.
import {
    groupTranslations,
    labelTranslations,
    protectionTranslations,
    siteTranslations,
    viewWords,
} from '../app/data/sites-i18n';

export const LANGUAGES = [
    { code: 'mn', label: 'Монгол', short: 'MN', htmlLang: 'mn', aiName: 'Mongolian (Cyrillic)' },
    { code: 'en', label: 'English', short: 'EN', htmlLang: 'en', aiName: 'English' },
    { code: 'ko', label: '한국어', short: 'KO', htmlLang: 'ko', aiName: 'Korean' },
    { code: 'zh', label: '中文', short: '中', htmlLang: 'zh-Hans', aiName: 'Simplified Chinese' },
    { code: 'ru', label: 'Русский', short: 'RU', htmlLang: 'ru', aiName: 'Russian' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);
export const isLanguage = (code) => LANGUAGE_CODES.includes(code);

// site.i18n — аяллын нэгтгэсэн дурсгал зэрэг runtime-д үүссэн дурсгалын орчуулга
const extra = (site, lang) => site?.i18n?.[lang] || siteTranslations[site?.id]?.[lang];

export function siteName(site, lang) {
    if (!site) return '';
    if (lang === 'mn') return site.name;
    return extra(site, lang)?.name || site.nameEn || site.name;
}

export function siteDescription(site, lang) {
    if (!site) return '';
    if (lang === 'mn') return site.description;
    return extra(site, lang)?.description || site.descriptionEn || site.description;
}

const fromDict = (dict, key, lang) => (lang === 'mn' ? key : dict[key]?.[lang] || dict[key]?.en || key);

export const groupName = (group, lang) => (group ? fromDict(groupTranslations, group, lang) : group);
export const hotspotLabel = (label, lang) => (label ? fromDict(labelTranslations, label, lang) : label);
export const protectionName = (status, lang) => (status ? fromDict(protectionTranslations, status, lang) : status);

/** Панорамын node-ийн нэр: "Бүлэг — 2-р харагдац" г.м. загварыг хэл бүрт хөрвүүлнэ. */
export function nodeName(node, lang) {
    const name = node?.name || '';
    if (lang === 'mn' || !name) return name;
    if (node[`name_${lang}`]) return node[`name_${lang}`];
    if (lang === 'en' && node.nameEn) return node.nameEn;

    const words = viewWords[lang] || viewWords.en;
    let m = name.match(/^(.*) — (\d+)-р харагдац$/);
    if (m) return `${groupName(node.group || m[1], lang)} — ${words.view} ${m[2]}`;
    m = name.match(/^(.*) — гадна үзэмж (\d+)$/);
    if (m) return `${groupName(m[1], lang)} — ${words.exterior} ${m[2]}`;
    m = name.match(/^(.*) \((\d+)\)$/);
    if (m) return `${groupName(m[1], lang)} (${m[2]})`;
    if (groupTranslations[name]) return groupName(name, lang);
    return name;
}

/** Ангиллын нэр — translations объектод түлхүүр нь монгол нэр. */
export const categoryName = (category, t) => t?.[category] || category;
