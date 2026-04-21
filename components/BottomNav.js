'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav({ t }) {
    const pathname = usePathname();

    const navItems = [
        { href: '/', icon: 'fa-solid fa-compass', label: t?.explore || 'Судлах' },
        { href: '/sites', icon: 'fa-solid fa-landmark', label: t?.navSitesShort || 'Дурсгал' },
        { href: '/map', icon: 'fa-solid fa-map', label: t?.navMapShort || 'Зураг' },
        { href: '/tours', icon: 'fa-solid fa-vr-cardboard', label: t?.navTours || 'Аялал' },
        { href: '/info', icon: 'fa-solid fa-circle-info', label: t?.profile || 'Мэдээлэл' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5 pt-16 bg-gradient-to-t from-[#070b14] via-[#070b14]/85 to-transparent pointer-events-none max-w-[480px] mx-auto">
            <nav
                className="pointer-events-auto rounded-2xl px-2 py-2 flex items-center gap-0.5"
                style={{
                    background: 'rgba(10,14,26,0.94)',
                    backdropFilter: 'blur(28px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-xl transition-all duration-200 relative group min-w-[52px]"
                            style={isActive ? {
                                background: 'rgba(245,158,11,0.1)',
                                color: '#fbbf24'
                            } : {}}
                        >
                            <i className={`${item.icon} text-[18px] transition-transform duration-200 ${
                                isActive ? 'scale-110' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-105'
                            }`}></i>
                            <span className={`text-[9px] tracking-wide leading-none ${
                                isActive ? 'font-bold' : 'font-medium text-slate-500 group-hover:text-slate-300'
                            }`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span
                                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400"
                                    style={{ boxShadow: '0 0 6px rgba(245,158,11,0.9)' }}
                                ></span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
