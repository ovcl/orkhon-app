// next.config.mjs (imageSizes + deviceSizes), lib/image-loader.js, scripts/build-images.mjs
// гурвуулаа энэ жагсаалтыг ашиглана — next/image зөвхөн эдгээр өргөнийг хүснэ.
const IMAGE_SIZES = [128, 256, 384];
const DEVICE_SIZES = [640, 1080, 1920];

module.exports = { IMAGE_SIZES, DEVICE_SIZES, IMAGE_WIDTHS: [...IMAGE_SIZES, ...DEVICE_SIZES] };
