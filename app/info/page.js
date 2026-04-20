'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import clsx from 'clsx';
import BottomNav from '../../components/BottomNav';

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

export default function InfoPage() {
    const [language, setLanguage] = useState('mn');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
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
            about: {
                title: "Орхоны хөндийн тухай",
                unesco: "ЮНЕСКО-гийн дэлхийн өв",
                year: "2004 онд бүртгэгдсэн",
                location: "Байршил",
                locationText: "Архангай, Өвөрхангай аймгууд",
                history: "Түүхэн ач холбогдол",
                historyText: "ДӨ-ОХСДГ нь хүн төрөлхтний түүх, соёлын бүхий л үеийг гэрчлэх археологийн дурсгалууд хадгалагдан үлдсэн өлгий нутаг бөгөөд наанадаж 58000,0 - 62000,0 жилийн өмнөх үеийн дунд палеолитоос эхлэлтэй түүх, археологийн бүхий л үеийн дурсгалууд оршдог. Монголын түүхэн соёлын хамгийн чухал дурсгалт газруудын нэг бөгөөд 1000 гаруй жилийн түүхтэй. Энд Түрэг, Уйгар, Монголын эзэнт гүрний нийслэл байрлаж байсан."
            },
            visitor: {
                title: "Зочдод зориулсан мэдээлэл",
                howToGet: "Хэрхэн очих",
                howToGetText: "Улаанбаатар хотоос 365 км, автомашинаар 5-6 цаг зайтай. Хархорин сум хүртэл нийтийн тээврээр очих боломжтой.",
                bestSeason: "Аялах тохиромжтой улирал",
                bestSeasonText: "5-р сараас 9-р сар хүртэл (хавар, зун, намар)",
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
                facebook: "Facebook: @OrkhonValley",
                instagram: "Instagram: @orkhon_valley"
            },
            app: {
                title: "Аппын тухай",
                version: "Хувилбар 1.0.0",
                developer: "Хөгжүүлэгч: Орхоны хөндийн захиргаа",
                purpose: "Зорилго",
                purposeText: "Энэхүү апп нь Орхоны хөндийн дурсгалт газруудыг танилцуулах, жуулчдад мэдээлэл өгөх зорилготой.",
                privacy: "Нууцлалын бодлого",
                privacyText: "Таны хувийн мэдээллийг хамгаалж, зөвхөн аппын үйл ажиллагаанд ашиглана."
            }
        },
        en: {
            title: "Information",
            profile: "Profile",
            explore: "Explore",
            navSitesShort: "Sites",
            navMapShort: "Map",
            about: {
                title: "About Orkhon Valley",
                unesco: "UNESCO World Heritage Site",
                year: "Inscribed in 2004",
                location: "Location",
                locationText: "Arkhangai and Uvurkhangai provinces",
                history: "Historical Significance",
                historyText: "The OVCL (Orkhon Valley Cultural Landscape) is a cradle of human history and culture, preserving archaeological monuments from all major eras. It features continuous archaeological sequences starting from the Middle Paleolithic (at least 58,000–62,000 years ago). As one of Mongolia's most pivotal cultural landmarks with over a millennium of documented history, it served as the imperial capital for the Turkic, Uyghur, and Mongol Empires."
            },
            visitor: {
                title: "Visitor Information",
                howToGet: "How to Get There",
                howToGetText: "365 km from Ulaanbaatar, 5-6 hours by car. Public transportation available to Kharkhorin town.",
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
                facebook: "Facebook: @OrkhonValley",
                instagram: "Instagram: @orkhon_valley"
            },
            app: {
                title: "About This App",
                version: "Version 1.0.0",
                developer: "Developer: Orkhon Valley Administration",
                purpose: "Purpose",
                purposeText: "This app aims to introduce Orkhon Valley heritage sites and provide information to tourists.",
                privacy: "Privacy Policy",
                privacyText: "We protect your personal information and use it only for app functionality."
            }
        }
    };

    const t = content[language];

    return (
        <div className="pb-28 min-h-screen bg-[#0f172a]">
            {/* Header */}
            <header
                className={clsx(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex justify-between items-center max-w-[480px] mx-auto w-full",
                    scrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-white/5 shadow-sm" : "bg-transparent"
                )}
            >
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5">
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <h1 className={clsx("font-heading font-bold text-lg text-white transition-all", scrolled ? "opacity-100" : "opacity-0")}>
                        {t.title}
                    </h1>
                </div>
                <button
                    onClick={toggleLanguage}
                    className="glass-panel px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors uppercase tracking-wider border border-white/5"
                >
                    {language === 'mn' ? 'EN' : 'MN'}
                </button>
            </header>

            <main className="pt-20 px-6">
                <motion.div
                    className="max-w-[480px] mx-auto px-5 pt-28 pb-32 flex flex-col gap-6"
                    variants={containerVariants}
                    initial="visible"
                    animate="visible"
                >
                    {/* About Section */}
                    <motion.section variants={itemVariants}>
                        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white mb-3 pl-1 border-l-2 border-amber-500">
                            <i className="fa-solid fa-mountain text-amber-500 text-sm ml-2 mr-1"></i>
                            {t.about.title}
                        </h2>
                        <div className="card-simple p-5 space-y-4 bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">{t.about.unesco}</span>
                                <span className="text-xs text-slate-400">{t.about.year}</span>
                            </div>

                            <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <div className="text-xs text-slate-400 mb-1 font-medium bg-slate-800/50 inline-block px-2 py-0.5 rounded">{t.about.location}</div>
                                <p className="text-sm text-slate-200">{t.about.locationText}</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left text-slate-500"></i> {t.about.history}
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed text-justify">{t.about.historyText}</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Visitor Info Section */}
                    <motion.section variants={itemVariants}>
                        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white mb-3 pl-1 border-l-2 border-blue-500">
                            <i className="fa-solid fa-circle-info text-blue-500 text-sm ml-2 mr-1"></i>
                            {t.visitor.title}
                        </h2>
                        <div className="card-simple p-5 space-y-4 bg-slate-800/50">
                            {[
                                { icon: "fa-solid fa-location-dot", label: t.visitor.howToGet, text: t.visitor.howToGetText, color: "text-red-400" },
                                { icon: "fa-solid fa-calendar", label: t.visitor.bestSeason, text: t.visitor.bestSeasonText, color: "text-orange-400" },
                                { icon: "fa-solid fa-hotel", label: t.visitor.accommodation, text: t.visitor.accommodationText, color: "text-indigo-400" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className={`mt-0.5 w-8 h-8 rounded-full bg-slate-700/50 flex flex-col items-center justify-center shrink-0 ${item.color}`}>
                                        <i className={item.icon}></i>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">{item.label}</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Season Visual */}
                    <motion.section variants={itemVariants}>
                        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white mb-3 pl-1 border-l-2 border-orange-500">
                            <i className="fa-solid fa-sun text-orange-400 text-sm ml-2 mr-1"></i>
                            {t.seasonTitle || 'Аялалын улирал'}
                        </h2>
                        <div className="card-simple p-5 bg-slate-800/50">
                            <p className="text-xs text-slate-400 mb-4">{t.seasonBestMonths || 'Тохиромжтой саруud: 5-9-р сар'}</p>
                            <div className="grid grid-cols-12 gap-1">
                                {[
                                    { num: 1, active: false },
                                    { num: 2, active: false },
                                    { num: 3, active: false },
                                    { num: 4, active: false },
                                    { num: 5, active: true },
                                    { num: 6, active: true },
                                    { num: 7, active: true },
                                    { num: 8, active: true },
                                    { num: 9, active: true },
                                    { num: 10, active: false },
                                    { num: 11, active: false },
                                    { num: 12, active: false },
                                ].map(({ num, active }) => (
                                    <div
                                        key={num}
                                        className={clsx(
                                            'flex flex-col items-center gap-1',
                                        )}
                                    >
                                        <div className={clsx(
                                            'w-full h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors',
                                            active
                                                ? 'bg-amber-500 text-slate-900'
                                                : 'bg-slate-700/50 text-slate-600'
                                        )}>
                                            {num}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> {t.seasonBestMonths ? (language === 'mn' ? 'Тохиромжтой' : 'Best season') : 'Тохиромжтой'}</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700 inline-block"></span> {language === 'mn' ? 'Хязгаарлагдмал' : 'Limited'}</span>
                            </div>
                        </div>
                    </motion.section>

                    {/* Regulations Section */}
                    <motion.section variants={itemVariants}>
                        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white mb-3 pl-1 border-l-2 border-red-500">
                            <i className="fa-solid fa-scale-balanced text-red-500 text-sm ml-2 mr-1"></i>
                            {t.regulations.title}
                        </h2>
                        <div className="card-simple p-5 space-y-4 bg-slate-800/50">
                            {[
                                { icon: "fa-solid fa-shield", label: t.regulations.protection, text: t.regulations.protectionText },
                                { icon: "fa-solid fa-camera", label: t.regulations.photography, text: t.regulations.photographyText },
                                { icon: "fa-solid fa-user-check", label: t.regulations.behavior, text: t.regulations.behaviorText }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-900/30 p-3 rounded-lg border border-white/5">
                                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <i className={item.icon}></i> {item.label}
                                    </h4>
                                    <p className="text-sm text-slate-300">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Contact Section */}
                    <motion.section variants={itemVariants}>
                        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white mb-3 pl-1 border-l-2 border-emerald-500">
                            <i className="fa-solid fa-address-book text-emerald-500 text-sm ml-2 mr-1"></i>
                            {t.contact.title}
                        </h2>
                        <div className="card-simple p-5 space-y-4 bg-slate-800/50 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-10 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                            <h3 className="font-bold text-white text-lg">{t.contact.office}</h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <i className="fa-solid fa-map-marker-alt text-emerald-400 w-5 text-center"></i>
                                    <span>{t.contact.address}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <i className="fa-solid fa-phone text-emerald-400 w-5 text-center"></i>
                                    <span>{t.contact.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <i className="fa-solid fa-envelope text-emerald-400 w-5 text-center"></i>
                                    <span>{t.contact.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <i className="fa-solid fa-globe text-emerald-400 w-5 text-center"></i>
                                    <a href="https://orkhonvalley.gov.mn" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                        {t.contact.website}
                                    </a>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <strong className="text-xs text-slate-500 uppercase tracking-widest block mb-3">{t.contact.social}</strong>
                                <div className="flex gap-3">
                                    <a href="#" className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                                        <i className="fa-brands fa-facebook text-lg"></i>
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-pink-400 hover:bg-pink-600 hover:text-white transition-all">
                                        <i className="fa-brands fa-instagram text-lg"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* App Info Section */}
                    <motion.section variants={itemVariants} className="pb-4">
                        <div className="text-center">
                            <div className="inline-flex w-12 h-12 mb-3 bg-white rounded-xl p-2 shadow-lg items-center justify-center">
                                <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 mb-1">{t.app.title}</h3>
                            <p className="text-xs text-slate-600 mb-6">{t.app.version}</p>

                            <div className="text-xs text-slate-500 max-w-[80%] mx-auto">
                                <p className="mb-2">{t.app.purposeText}</p>
                                <p>{t.app.privacyText}</p>
                            </div>
                        </div>
                    </motion.section>
                </motion.div>
            </main>

            <BottomNav t={t} />
        </div>
    );
}
