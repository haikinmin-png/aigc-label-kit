import { generateContentId } from './content-id.js';

/**
 * The implicit-label payload. Field set follows the elements required for
 * implicit labels by GB 45438-2025 (网络安全技术 人工智能生成合成内容标识方法):
 *  - Label:         content attribute — this file is AI generated/synthesized
 *  - ContentType:   image | audio | video | text
 *  - ProviderName:  name of the service provider (the company operating the
 *                   service that produced the content — NOT the API vendor)
 *  - ProviderCode:  provider code (e.g. unified social credit code)
 *  - ContentID:     unique ID of this piece of content
 *  - GeneratedAt:   ISO-8601 generation time (optional but recommended)
 */
export const LABEL_KEYWORD = 'AIGC';

export function buildPayload({ providerName, providerCode, contentType = 'image', contentId, generatedAt } = {}) {
  const payload = {
    Label: 'AIGC',
    ContentType: contentType,
    ProviderName: providerName ?? '',
    ProviderCode: providerCode ?? '',
    ContentID: contentId ?? generateContentId(),
    GeneratedAt: generatedAt ?? new Date().toISOString(),
  };
  return payload;
}

/** Returns { ok, missing: string[] } — implicit labels are incomplete without provider + content ID. */
export function validatePayload(payload) {
  const missing = [];
  if (!payload || typeof payload !== 'object') return { ok: false, missing: ['payload'] };
  if (payload.Label !== 'AIGC') missing.push('Label');
  if (!payload.ProviderName && !payload.ProviderCode) missing.push('ProviderName/ProviderCode');
  if (!payload.ContentID) missing.push('ContentID');
  return { ok: missing.length === 0, missing };
}
