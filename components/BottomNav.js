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
        { href: '/info', icon: 'fa-solid fa-circle-info', label: t?.profile || 'Профайл' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5 pt-20 bg-gradient-to-t from-[#070b14] via-[#070b14]/70 to-transparent pointer-events-none">
            <nav
                className="pointer-events-auto rounded-2xl px-2.5 py-2.5 flex items-center gap-0.5 shadow-2xl shadow-black/60"
                style={{
                    background: 'rgba(7, 11, 20, 0.88)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-xl transition-all duration-300 relative group ${isActive
                                    ? 'text-amber-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            style={isActive ? {
                                background: 'rgba(245, 158, 11, 0.08)',
                            } : {}}
                        >
                            <i className={`${item.icon} text-lg transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'
                                }`}></i>
                            <span className={`text-[9px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'
                                }`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span
                                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400"
                                    style={{ boxShadow: '0 0 8px rgba(245, 158, 11, 0.7)' }}
                                ></span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
