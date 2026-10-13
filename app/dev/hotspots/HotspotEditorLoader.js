'use client';

import dynamic from 'next/dynamic';

const HotspotEditor = dynamic(() => import('../../../components/HotspotEditor'), { ssr: false });

export default function HotspotEditorLoader() {
    return <HotspotEditor />;
}
