'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

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
            <h2 style={{ marginBottom: '20px' }}>Алдаа гарлаа!</h2>
            <button
                onClick={() => reset()}
                style={{
                    padding: '10px 20px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                Дахин ачаалах
            </button>
        </div>
    );
}
