import sharp from "sharp";

/**
 * Optimize image buffer before upload
 * - fixes rotation
 * - caps resolution
 * - compresses aggressively but safely
 * - strips metadata (GPS, EXIF)
 */
export const optimizeImageBuffer = async (
  buffer,
  { maxWidth = 1600, maxHeight = 1600, quality = 80, format = "jpeg" } = {}
) => {
  return sharp(buffer)
    .rotate() // auto-orientation
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat(format, {
      quality,
      mozjpeg: true,
    })
    .toBuffer();
};
