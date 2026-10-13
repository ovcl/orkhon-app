# Орхоны хөндийн соёлын дурсгалт газар — виртуал хөтөч

UNESCO-гийн Дэлхийн өвд бүртгэлтэй (2004, шалгуур ii, iii, iv) Орхоны хөндийн соёлын дурсгалт газрын (ОВЦЛ) албан ёсны PWA апп.
32 дурсгал, 84 панорама бүхий VR аялал, 7 ширхэг 3D/AR загвар, интерактив газрын зураг, AI хөтөчтэй. **Бүрэн офлайн** ажиллах боломжтой.

## Боломжууд

| | |
|---|---|
| 🏛️ Дурсгалууд | 32 дурсгал, зураг, тайлбар (MN/EN), хамгаалалтын зэрэглэл |
| 🥽 VR аялал | Three.js + WebXR (Quest), hotspot навигаци, байршлын эскиз, гироскоп, чимхэж томруулах, харанхуй зургийг автоматаар гэрэлтүүлэх, `/tours?site=ID` |
| 🧊 3D / AR | `@google/model-viewer` — утасны камераар AR |
| 🗺️ Газрын зураг | MapLibre GL 6 — OpenFreeMap (энгийн/шөнийн), Sentinel-2 2024 хиймэл дагуул, 3D гадарга, миний байршил, зам заах |
| 📴 Офлайн | Дурсгал тус бүр эсвэл бүх контентыг (≈1.7 GB) + газрын зургийг татаж авна |
| 🤖 AI хөтөч | OpenAI, дурсгалын өгөгдөлд тулгуурласан, rate limit-тэй (сонголттой) |
| 🌐 Хэл | Монгол, English, 한국어, 中文, Русский (`/map?lang=ko` г.м.) |
| 🖥️ Киоск | `?kiosk=1` — идэвхгүй үед нүүр хуудас руу буцна |
| 🔌 Нээлттэй API | `/api/sites`, `/api/sites/:id`, `/api/sites/geojson`, `/api/health` |

## Хөгжүүлэлт

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

`npm run dev` / `npm run build` нь дараах скриптүүдийг автоматаар ажиллуулна:

- `scripts/check-media.mjs` — `sites.js`-ийн бүх зураг/загварын зам файлтай **том/жижиг үсэг хүртэл** таарч байгааг шалгана (Windows дээр ажиллаад Vercel дээр 404 өгөх алдааг барина). Таараагүй бол build зогсоно.
- `scripts/copy-maplibre-worker.mjs` — MapLibre worker-ийг `public/maplibre/` руу хуулна.
- `scripts/build-images.mjs` — `next/image`-д зориулсан WebP хэмжээсүүдийг (128–1920px) `public/_img/`-д үүсгэнэ. Эх зураг өөрчлөгдөхгүй. Анх ~25 сек, дараа нь кэшээс (`node_modules/.cache/orkhon-img`) шууд.
- `scripts/build-panoramas.mjs` — панорама бүрийн 2048px preview, эскиз, гэрэлтүүлгийн утгыг (`app/data/panorama-manifest.json`) үүсгэнэ. Эх 8K зураг өөрчлөгдөхгүй.
- `scripts/build-media-manifest.mjs` — офлайн татах хэмжээг тооцох `app/data/media-manifest.json` үүсгэнэ.

Service worker зөвхөн production горимд (`npm run build && npm start`) идэвхжинэ.

### Hotspot тааруулах
`npm run dev` ажиллуулаад <http://localhost:3000/dev/hotspots> нээнэ:
1. Дурсгал, панорамаа сонгоно (улаан тоо — анхны 0°/180° утгатай, тааруулаагүй hotspot).
2. Hotspot-ын **📍 Байрлуулах** товчийг дараад панорама дээрх хаалга/зам руу дарна.
3. **Хадгалаад дараах →** — `app/data/sites.js` шууд шинэчлэгдэж, дараагийн панорама руу шилжинэ.

Зөвхөн dev горимд ажиллана (production-д `/dev/hotspots` болон `/api/dev/hotspots` 404). Дууссаны дараа `git diff app/data/sites.js`-ээр шалгаад commit хийнэ.

## Байршуулах

### Vercel (санал болгох)
1. GitHub репог Vercel-д холбоно — Next.js автоматаар танигдана.
2. Environment Variables: `NEXT_PUBLIC_SITE_URL` (заавал), `OPENAI_API_KEY` (сонголттой). Бусад нь `.env.local.example`-д.
3. Deploy. Шалгах: `https://<домэйн>/api/health`.

> Зургийн хэмжээсүүд build үед статикаар үүсдэг тул Vercel Image Optimization огт ашиглагдахгүй (Hobby квот хэрэглэгдэхгүй). Зураг CDN-ээс шууд ирнэ.

### Docker / музейн дотоод сервер (интернэтгүй киоск)
```bash
docker build -t orkhon-app .
docker run -d -p 3000:3000 --env-file .env.local --restart unless-stopped orkhon-app
```
Service worker болон камер (AR) нь HTTPS шаарддаг тул дотоод сүлжээнд `mkcert`-ээр гэрчилгээ үүсгэж reverse proxy (Caddy/nginx)-ийн ард ажиллуулна. `localhost` дээр HTTPS шаардлагагүй.

## Офлайн горимын бүтэц

- **Service worker:** `app/sw.js` (Serwist) → build үед `public/sw.js`.
- **Precache (суулгах үед):** апп-ын JS/CSS, фонт, icon, лого, офлайн хуудас, MapLibre worker.
- **Runtime cache:** үзсэн хуудас, зураг, панорама, 3D загвар, газрын зургийн tile.
- **Хэрэглэгч сонгож татах:** дурсгалын хуудсан дээрх "Офлайн хадгалах", Мэдээлэл → "Офлайн горим" хэсэгт "Бүх контентыг татах" / "Газрын зураг татах".
- Кэшийн нэрс `app/sw.js` ба `lib/offline.js`-д ижил байх ёстой.

## Бүтэц

```
app/            Хуудсууд (App Router), API маршрут, data/sites.js (32 дурсгал)
components/     PanoramaViewer, VirtualTour, Map, Model3DViewer, AIGuide, OfflineManager …
lib/            offline.js (Cache API), image-loader.js, rate-limit.js, site-summary.js
public/         images/ (≈1.7 GB, эх чанараар), models/ (.glb, Draco), sounds/
scripts/        build-ийн өмнөх шалгалт, бэлтгэл скриптүүд
```

Шинэ дурсгал / панорама нэмэх: `app/data/sites.js`-д бичээд `npm run check:media` ажиллуулна.

### Орчуулга
- UI мөрүүд: `app/data/translations.js` (mn, en) ба `app/data/translations-intl.js` (ko, zh, ru) — түлхүүр бүх хэлэнд ижил.
- Дурсгалын нэр/тайлбар: mn/en нь `sites.js`-д, ko/zh/ru нь `app/data/sites-i18n.js`-д (панорамын бүлэг, hotspot шошго хамт). Орчуулга дутвал англи → монгол руу буцна.
- ko/zh/ru нь машин орчуулга тул эх хэлтэй хүнээр хянуулахыг зөвлөнө.

### Газрын зургийн эх сурвалж
OpenFreeMap / OpenStreetMap (вектор), EOX Sentinel-2 cloudless 2024 (CC BY-NC-SA 4.0 — арилжааны бус хэрэглээ), AWS Terrain Tiles (өндөршил). API түлхүүр шаардлагагүй. Тохиргоо: `lib/map-styles.js`.

Unity WebGL аялал: `UNITY_SETUP.md`. Build-ийг `public/unity-build/`-д хийсний дараа `app/tours/page.js`-ийн `UNITY_ENABLED`-ийг `true` болгоно.
