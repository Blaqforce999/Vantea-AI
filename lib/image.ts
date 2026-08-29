/**
 * Client-side image compression for the "basic upload" path (see
 * .claude/plans/unified-crafting-charm.md Phase 15, scope decision #2). No
 * object storage is configured, so item photos are resized/compressed in
 * the browser and stored as a data: URI directly in Item.imageUrl.
 */

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.8;
const MAX_DATA_URL_LENGTH = 700_000; // leaves headroom under the 1MB validator cap

export class ImageTooLargeError extends Error {}

export async function compressImageFile(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new ImageTooLargeError('Image is still too large after compression.');
  }
  return dataUrl;
}
