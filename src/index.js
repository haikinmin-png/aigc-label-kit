import { isPng, writePngLabel, readPngLabel } from './png.js';
import { isJpeg, writeJpegLabel, readJpegLabel } from './jpeg.js';
import { buildPayload, validatePayload } from './payload.js';

export { buildPayload, validatePayload } from './payload.js';
export { generateContentId } from './content-id.js';
export { explicitLabelSpec, buildSvgOverlay } from './explicit-label.js';
export { isPng, writePngLabel, readPngLabel } from './png.js';
export { isJpeg, writeJpegLabel, readJpegLabel } from './jpeg.js';

/**
 * Embed an implicit AIGC label into an image buffer (PNG / JPEG).
 * Pass provider info once; the kit fills content ID + timestamp.
 * Returns { buffer, payload } — keep payload.ContentID in your database.
 */
export function labelImage(buffer, options = {}) {
  const payload = buildPayload(options);
  const check = validatePayload(payload);
  if (!check.ok) throw new Error(`Incomplete label payload, missing: ${check.missing.join(', ')}`);
  if (isPng(buffer)) return { buffer: writePngLabel(buffer, payload), payload };
  if (isJpeg(buffer)) return { buffer: writeJpegLabel(buffer, payload), payload };
  throw new Error('Unsupported image format: only PNG and JPEG are supported in this version (WebP/MP4/MP3 on the roadmap)');
}

/** Read the implicit AIGC label from an image buffer. Returns the payload or null. */
export function readImageLabel(buffer) {
  if (isPng(buffer)) return readPngLabel(buffer);
  if (isJpeg(buffer)) return readJpegLabel(buffer);
  return null;
}

/** Verify an image buffer carries a complete implicit label. */
export function verifyImageLabel(buffer) {
  const payload = readImageLabel(buffer);
  if (!payload) return { ok: false, payload: null, missing: ['label'] };
  const { ok, missing } = validatePayload(payload);
  return { ok, payload, missing };
}
