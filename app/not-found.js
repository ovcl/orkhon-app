import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="h-screen flex flex-col items-center justify-center p-5 bg-slate-900 text-white text-center">
            <h2 className="mb-2.5">404 - Хуудас олдсонгүй</h2>
            <p className="text-slate-400 mb-[30px]">Таны хайсан хуудас байхгүй эсвэл нүүсэн байна.</p>
            <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg no-underline">
                Нүүр хуудас руу буцах
            </Link>
        </div>
    );
}
