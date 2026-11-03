import { randomBytes } from 'node:crypto';

/**
 * Generate a unique content ID for one generated asset.
 * Format: aigc-<yyyymmdd>-<16 hex chars>. The ID only needs to be unique
 * and stable for the lifetime of the file; keep your own mapping from
 * content ID -> generation task in your database.
 */
export function generateContentId(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `aigc-${y}${m}${d}-${randomBytes(8).toString('hex')}`;
}
