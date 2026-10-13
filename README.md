# Орхоны хөндийн соёлын дурсгалт газар — виртуал хөтөч

UNESCO-гийн Дэлхийн өвд бүртгэлтэй (2004, шалгуур ii, iii, iv) Орхоны хөндийн соёлын дурсгалт газрын (ОВЦЛ) албан ёсны PWA апп.
32 дурсгал, 84 панорама бүхий VR аялал, 7 ширхэг 3D/AR загвар, интерактив газрын зураг, AI хөтөчтэй. **Бүрэн офлайн** ажиллах боломжтой.

## Боломжууд

| | |
|---|---|
| 🏛️ Дурсгалууд | 32 дурсгал, зураг, тайлбар (MN/EN), хамгаалалтын зэрэглэл |
| 🥽 VR аялал | Three.js + WebXR (Quest), hotspot навигаци, `/tours?site=ID` шууд холбоос |
| 🧊 3D / AR | `@google/model-viewer` — утасны камераар AR |
| 🗺️ Газрын зураг | MapLibre GL 6, ангиллын шүүлтүүр |
| 📴 Офлайн | Дурсгал тус бүр эсвэл бүх контентыг (≈1.7 GB) + газрын зургийг татаж авна |
| 🤖 AI хөтөч | OpenAI, дурсгалын өгөгдөлд тулгуурласан, rate limit-тэй (сонголттой) |
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
- `scripts/build-media-manifest.mjs` — офлайн татах хэмжээг тооцох `app/data/media-manifest.json` үүсгэнэ.

Service worker зөвхөн production горимд (`npm run build && npm start`) идэвхжинэ.

## Байршуулах

### Vercel (санал болгох)
1. GitHub репог Vercel-д холбоно — Next.js автоматаар танигдана.
2. Environment Variables: `NEXT_PUBLIC_SITE_URL` (заавал), `OPENAI_API_KEY` (сонголттой). Бусад нь `.env.local.example`-д.
3. Deploy. Шалгах: `https://<домэйн>/api/health`.

> Анхаар: Vercel Hobby багцад зураг боловсруулах (Image Optimization) сарын квоттой. Хэрэглээ өсвөл Pro багц эсвэл доорх Docker хувилбарыг ашиглана.

### Docker / музейн дотоод сервер (интернэтгүй киоск)
```bash
docker build -t orkhon-app .
docker run -d -p 3000:3000 --env-file .env.local --restart unless-stopped orkhon-app
```
Service worker болон камер (AR) нь HTTPS шаарддаг тул дотоод сүлжээнд `mkcert`-ээр гэрчилгээ үүсгэж reverse proxy (Caddy/nginx)-ийн ард ажиллуулна. `localhost` дээр HTTPS шаардлагагүй.

## Офлайн горимын бүтэц

- **Precache (суулгах үед):** апп-ын JS/CSS, фонт, icon, лого, офлайн хуудас, MapLibre worker.
- **Runtime cache:** үзсэн хуудас, зураг, панорама, 3D загвар, газрын зургийн tile.
- **Хэрэглэгч сонгож татах:** дурсгалын хуудсан дээрх "Офлайн хадгалах", Мэдээлэл → "Офлайн горим" хэсэгт "Бүх контентыг татах" / "Газрын зураг татах".
- Кэшийн нэрс `next.config.js` ба `lib/offline.js`-д ижил байх ёстой.

## Бүтэц

```
app/            Хуудсууд (App Router), API маршрут, data/sites.js (32 дурсгал)
components/     PanoramaViewer, VirtualTour, Map, Model3DViewer, AIGuide, OfflineManager …
lib/            offline.js (Cache API), rate-limit.js, site-summary.js
public/         images/ (≈1.7 GB, эх чанараар), models/ (.glb, Draco), sounds/
scripts/        build-ийн өмнөх шалгалт, бэлтгэл скриптүүд
```

Шинэ дурсгал / панорама нэмэх: `app/data/sites.js`-д бичээд `npm run check:media` ажиллуулна.

Unity WebGL аялал: `UNITY_SETUP.md`. Build-ийг `public/unity-build/`-д хийсний дараа `app/tours/page.js`-ийн `UNITY_ENABLED`-ийг `true` болгоно.
