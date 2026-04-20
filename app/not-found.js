import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: '#0f172a',
            color: 'white',
            textAlign: 'center'
        }}>
            <h2 style={{ marginBottom: '10px' }}>404 - Хуудас олдсонгүй</h2>
            <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Таны хайсан хуудас байхгүй эсвэл нүүсэн байна.</p>
            <Link
                href="/"
                style={{
                    padding: '10px 20px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    textDecoration: 'none'
                }}
            >
                Нүүр хуудас руу буцах
            </Link>
        </div>
    );
}
