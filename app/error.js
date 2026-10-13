'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="h-screen flex flex-col items-center justify-center p-5 bg-slate-900 text-white text-center">
            <h2 className="mb-5">Алдаа гарлаа!</h2>
            <button onClick={() => reset()} className="px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer">
                Дахин ачаалах
            </button>
        </div>
    );
}
