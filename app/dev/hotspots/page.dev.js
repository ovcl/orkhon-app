import HotspotEditorLoader from './HotspotEditorLoader';

// Hotspot тааруулах хэрэгсэл. `.dev.js` өргөтгөлтэй тул зөвхөн `npm run dev` үед
// маршрут болно — production build-д огт ордоггүй (next.config.mjs → pageExtensions).
export const metadata = { title: 'Hotspot тааруулах', robots: { index: false } };

export default function HotspotEditorPage() {
    return <HotspotEditorLoader />;
}
