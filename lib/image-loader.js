// next/image custom loader — build үед үүсгэсэн статик WebP хэмжээсүүд рүү заана
// (scripts/build-images.mjs). Жагсаалтад байхгүй зураг (гадны URL г.м.)-ийг шууд буцаана.
import generated from '../app/data/image-manifest.json';
import { IMAGE_WIDTHS } from './image-widths';

const available = new Set(generated);

export function imageVariant(src, width) {
    if (!available.has(src)) return src;
    const w = IMAGE_WIDTHS.find((size) => size >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
    // srcset нь хоосон зайгаар салгагддаг тул замыг encode хийнэ
    return encodeURI(`/_img/${w}${src.replace(/\.[^.]+$/, '')}.webp`);
}

export default function imageLoader({ src, width }) {
    return imageVariant(src, width);
}
