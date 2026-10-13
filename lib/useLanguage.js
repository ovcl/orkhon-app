'use client';

import { useCallback, useEffect, useState } from 'react';
import { LANGUAGES, isLanguage } from './i18n';

const STORAGE_KEY = 'language';
const EVENT = 'orkhon:language';

function readStored() {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return isLanguage(v) ? v : null;
    } catch {
        return null;
    }
}

/**
 * Апп даяар нэг хэл: localStorage-д хадгалж, бүх нээлттэй компонентод (event-ээр) шууд түгээнэ.
 * SSR дээр 'mn'-ээр render хийгээд mount болмогц хадгалсан хэл рүү шилжинэ.
 */
export function useLanguage() {
    const [language, setLanguageState] = useState('mn');

    useEffect(() => {
        const stored = readStored();
        if (stored) setLanguageState(stored);
        const onChange = (e) => setLanguageState(e.detail);
        const onStorage = (e) => e.key === STORAGE_KEY && isLanguage(e.newValue) && setLanguageState(e.newValue);
        window.addEventListener(EVENT, onChange);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(EVENT, onChange);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    useEffect(() => {
        const meta = LANGUAGES.find((l) => l.code === language);
        if (meta) document.documentElement.lang = meta.htmlLang;
    }, [language]);

    const setLanguage = useCallback((code) => {
        if (!isLanguage(code)) return;
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch {}
        setLanguageState(code);
        window.dispatchEvent(new CustomEvent(EVENT, { detail: code }));
    }, []);

    return [language, setLanguage];
}
