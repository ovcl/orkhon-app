'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import clsx from 'clsx';
import BottomNav from '../../components/BottomNav';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

export default function InfoPage() {
    const [language, setLanguage] = useState('mn');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'mn' ? 'en' : 'mn';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const content = {
        mn: {
            title: "Мэдээлэл",
            profile: "Профайл",
            explore: "Судлах",
            navSitesShort: "Дурсгал",
            navMapShort: "Зураг",
            navTours: "Аялал",
            about: {
                title: "Орхоны хөндийн тухай",
                unesco: "ЮНЕСКО-гийн дэлхийн өв",
                year: "2004 онд бүртгэгдсэн",
                location: "Байршил",
                locationText: "Архангай, Өвөрхангай аймгууд",
                history: "Түүхэн ач холбогдол",
                historyText: "Орхоны хөндий нь хүн төрөлхтний түүх, соёлын бүхий л үеийг гэрчлэх археологийн дурсгалуудыг хадгалж буй өлгий нутаг бөгөөд наанадаж 58,000–62,000 жилийн өмнөх дунд палеолитоос эхлэлтэй түүхтэй. Монголын хамгийн чухал дурсгалт газруудын нэг бөгөөд Түрэг, Уйгар, Монголын эзэнт гүрний нийслэл байрлаж байсан."
            },
            visitor: {
                title: "Зочдод зориулсан мэдээлэл",
                howToGet: "Хэрхэн очих",
                howToGetText: "Улаанбаатар хотоос 365 км, автомашинаар 5–6 цаг. Хархорин сум хүртэл нийтийн тээврээр очих боломжтой.",
                bestSeason: "Аялах тохиромжтой улирал",
                bestSeasonText: "5-р сараас 9-р сар (хавар, зун, намар)",
                accommodation: "Байр сууц",
                accommodationText: "Хархорин суманд зочид буудал, жуулчны бааз байдаг. Урьдчилан захиалга хийх шаардлагатай."
            },
            regulations: {
                title: "Дүрэм журам",
                protection: "Дурсгалт газрын хамгаалалт",
                protectionText: "Дурсгалт газруудыг хамгаалах, хадгалах үүрэгтэй. Дурсгалыг гэмтээх, бохирдуулах хориотой.",
                photography: "Гэрэл зураг авах",
                photographyText: "Ихэнх газарт чөлөөтэй гэрэл зураг авч болно. Музей, сүм хийдэд тусгай зөвшөрөл шаардлагатай.",
                behavior: "Зочдод зориулсан журам",
                behaviorText: "Дурсгалт газруудад хүндэтгэлтэй хандах, орон нутгийн соёл заншлыг хүндэтгэх."
            },
            contact: {
                title: "Холбоо барих",
                office: "Орхоны хөндийн захиргаа",
                address: "Хаяг: Хархорин сум, Өвөрхангай аймаг",
                phone: "Утас: +976-70XX-XXXX",
                email: "И-мэйл: info@orkhonvalley.gov.mn",
                website: "Вэбсайт: www.orkhonvalley.gov.mn",
                social: "Нийгмийн сүлжээ",
            },
            app: {
                title: "Аппын тухай",
                version: "Хувилбар 1.0.0",
                purposeText: "Энэхүү апп нь Орхоны хөндийн дурсгалт газруудыг танилцуулах, жуулчдад мэдээлэл өгөх зорилготой.",
                privacyText: "Таны хувийн мэдээллийг хамгаалж, зөвхөн аппын үйл ажиллагаанд ашиглана."
            },
            seasonTitle: "Аялалын улирал",
            seasonBestMonths: "Тохиромжтой саруud: 5–9-р сар"
        },
        en: {
            title: "Information",
            profile: "Profile",
            explore: "Explore",
            navSitesShort: "Sites",
            navMapShort: "Map",
            navTours: "Tours",
            about: {
                title: "About Orkhon Valley",
                unesco: "UNESCO World Heritage Site",
                year: "Inscribed in 2004",
                location: "Location",
                locationText: "Arkhangai and Uvurkhangai provinces",
                history: "Historical Significance",
                historyText: "The Orkhon Valley Cultural Landscape is a cradle of human history and culture, preserving archaeological monuments spanning the Middle Paleolithic (58,000–62,000 years ago) to modern times. One of Mongolia's most pivotal cultural landmarks, it served as the imperial capital for Turkic, Uyghur, and Mongol Empires."
            },
            visitor: {
                title: "Visitor Information",
                howToGet: "How to Get There",
                howToGetText: "365 km from Ulaanbaatar, 5–6 hours by car. Public transportation available to Kharkhorin.",
                bestSeason: "Best Season to Visit",
                bestSeasonText: "May to September (Spring, Summer, Autumn)",
                accommodation: "Accommodation",
                accommodationText: "Hotels and tourist camps available in Kharkhorin. Advance booking recommended."
            },
            regulations: {
                title: "Regulations",
                protection: "Heritage Protection",
                protectionText: "Visitors must protect and preserve heritage sites. Damaging or polluting sites is prohibited.",
                photography: "Photography",
                photographyText: "Photography is generally allowed at most sites. Special permission required for museums and temples.",
                behavior: "Visitor Guidelines",
                behaviorText: "Treat heritage sites with respect and honor local culture and traditions."
            },
            contact: {
                title: "Contact Information",
                office: "Orkhon Valley Administration",
                address: "Address: Kharkhorin, Uvurkhangai Province",
                phone: "Phone: +976-70XX-XXXX",
                email: "Email: info@orkhonvalley.gov.mn",
                website: "Website: www.orkhonvalley.gov.mn",
                social: "Social Media",
            },
            app: {
                title: "About This App",
                version: "Version 1.0.0",
                purposeText: "This app aims to introduce Orkhon Valley heritage sites and provide information to tourists.",
                privacyText: "We protect your personal information and use it only for app functionality."
            },
            seasonTitle: "Visit Season",
            seasonBestMonths: "Best months: May–September"
        }
    };

    const t = content[language];

    const CARD_BG = { background: 'rgba(16,24,48,0.6)', border: '1px solid rgba(255,255,255,0.06)' };

    return (
        <div className="pb-28 min-h-screen" style={{ background: '#070b14' }}>
            {/* Header */}
            <header className={clsx(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-5 py-4 flex justify-between items-center max-w-[480px] mx-auto w-full",
                scrolled ? "bg-[#070b14]/95 backdrop-blur-xl border-b border-white/5 shadow-lg" : "bg-transparent"
            )}>
                <div className="flex items-center gap-3">
                    <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors border border-white/8"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <h1 className={clsx("font-heading font-bold text-lg text-white transition-all", scrolled ? "opacity-100" : "opacity-0")}>
                        {t.title}
                    </h1>
                </div>
                <button onClick={toggleLanguage}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest border border-white/8">
                    {language === 'mn' ? 'EN' : 'MN'}
                </button>
            </header>

            <main className="pt-20 px-5">
                {/* FIX: initial="hidden" */}
                <motion.div
                    className="flex flex-col gap-6 pt-4 pb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* About */}
                    <motion.section variants={itemVariants}>
                        <SectionTitle icon="fa-solid fa-mountain" color="border-amber-500" iconColor="text-amber-500" title={t.about.title} />
                        <div className="rounded-2xl p-5 space-y-4" style={CARD_BG}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                    {t.about.unesco}
                                </span>
                                <span className="text-xs text-slate-500">{t.about.year}</span>
                            </div>
                            <div className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">{t.about.location}</div>
                                <p className="text-sm text-slate-200">{t.about.locationText}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left text-slate-500 text-[10px]"></i> {t.about.history}
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{t.about.historyText}</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Visitor */}
                    <motion.section variants={itemVariants}>
                        <SectionTitle icon="fa-solid fa-circle-info" color="border-blue-500" iconColor="text-blue-500" title={t.visitor.title} />
                        <div className="rounded-2xl p-5 space-y-5" style={CARD_BG}>
                            {[
                                { icon: "fa-solid fa-location-dot", label: t.visitor.howToGet, text: t.visitor.howToGetText, color: "text-red-400" },
                                { icon: "fa-solid fa-calendar", label: t.visitor.bestSeason, text: t.visitor.bestSeasonText, color: "text-orange-400" },
                                { icon: "fa-solid fa-hotel", label: t.visitor.accommodation, text: t.visitor.accommodationText, color: "text-indigo-400" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.color}`}
                                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        <i className={`${item.icon} text-sm`}></i>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">{item.label}</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Season */}
                    <motion.section variants={itemVariants}>
                        <SectionTitle icon="fa-solid fa-sun" color="border-orange-500" iconColor="text-orange-400" title={t.seasonTitle} />
                        <div className="rounded-2xl p-5" style={CARD_BG}>
                            <p className="text-xs text-slate-500 mb-4">{t.seasonBestMonths}</p>
                            <div className="grid grid-cols-12 gap-1">
                                {Array.from({ length: 12 }, (_, i) => {
                                    const month = i + 1;
                                    const active = month >= 5 && month <= 9;
                                    return (
                                        <div key={month} className={clsx(
                                            "h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors",
                                            active ? "bg-amber-500 text-slate-900" : "text-slate-600"
                                        )} style={active ? {} : { background: 'rgba(255,255,255,0.04)' }}>
                                            {month}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                                    {language === 'mn' ? 'Тохиромжтой' : 'Best season'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded inline-block" style={{ background: 'rgba(255,255,255,0.06)' }}></span>
                                    {language === 'mn' ? 'Хязгаарлагдмал' : 'Limited'}
                                </span>
                            </div>
                        </div>
                    </motion.section>

                    {/* Regulations */}
                    <motion.section variants={itemVariants}>
                        <SectionTitle icon="fa-solid fa-scale-balanced" color="border-red-500" iconColor="text-red-500" title={t.regulations.title} />
                        <div className="rounded-2xl p-5 space-y-3" style={CARD_BG}>
                            {[
                                { icon: "fa-solid fa-shield", label: t.regulations.protection, text: t.regulations.protectionText },
                                { icon: "fa-solid fa-camera", label: t.regulations.photography, text: t.regulations.photographyText },
                                { icon: "fa-solid fa-user-check", label: t.regulations.behavior, text: t.regulations.behaviorText }
                            ].map((item, idx) => (
                                <div key={idx} className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <i className={item.icon}></i> {item.label}
                                    </h4>
                                    <p className="text-sm text-slate-300">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Contact */}
                    <motion.section variants={itemVariants}>
                        <SectionTitle icon="fa-solid fa-address-book" color="border-emerald-500" iconColor="text-emerald-500" title={t.contact.title} />
                        <div className="rounded-2xl p-5 space-y-4" style={CARD_BG}>
                            <h3 className="font-bold text-white text-base">{t.contact.office}</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: "fa-solid fa-map-marker-alt", text: t.contact.address },
                                    { icon: "fa-solid fa-phone", text: t.contact.phone },
                                    { icon: "fa-solid fa-envelope", text: t.contact.email },
                                    { icon: "fa-solid fa-globe", text: t.contact.website, link: "https://orkhonvalley.gov.mn" },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                        <i className={`${item.icon} text-emerald-400 w-4 text-center flex-shrink-0`}></i>
                                        {item.link ? (
                                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{item.text}</a>
                                        ) : <span>{item.text}</span>}
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">{t.contact.social}</p>
                                <div className="flex gap-2">
                                    {[
                                        { icon: "fa-brands fa-facebook", color: "text-blue-400", hover: "hover:bg-blue-600" },
                                        { icon: "fa-brands fa-instagram", color: "text-pink-400", hover: "hover:bg-pink-600" },
                                    ].map((s, i) => (
                                        <a key={i} href="#"
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${s.color} ${s.hover} hover:text-white transition-all border border-white/8`}
                                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <i className={`${s.icon} text-lg`}></i>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* App info */}
                    <motion.section variants={itemVariants} className="pb-4 text-center">
                        <div className="inline-flex w-12 h-12 mb-3 bg-white rounded-2xl p-2 shadow-lg items-center justify-center">
                            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-400 mb-1">{t.app.title}</h3>
                        <p className="text-xs text-slate-600 mb-5">{t.app.version}</p>
                        <div className="text-xs text-slate-500 max-w-[80%] mx-auto space-y-2">
                            <p>{t.app.purposeText}</p>
                            <p>{t.app.privacyText}</p>
                        </div>
                    </motion.section>
                </motion.div>
            </main>

            <BottomNav t={t} />
        </div>
    );
}

function SectionTitle({ icon, color, iconColor, title }) {
    return (
        <h2 className={`flex items-center gap-2 font-heading text-lg font-bold text-white mb-3 pl-3 border-l-2 ${color}`}>
            <i className={`${icon} ${iconColor} text-sm`}></i>
            {title}
        </h2>
    );
}
