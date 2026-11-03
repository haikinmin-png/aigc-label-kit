import { LABEL_KEYWORD } from './payload.js';

const MARKER_PREFIX = `${LABEL_KEYWORD}:`;

export function isJpeg(buffer) {
  return buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
}

// Walk marker segments until SOS (0xDA) or EOI (0xD9). Returns [{marker, start, end, dataStart, dataEnd}]
function parseSegments(buffer) {
  const segments = [];
  let offset = 2; // skip SOI
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    const end = offset + 2 + length;
    if (end > buffer.length) break;
    segments.push({ marker, start: offset, end, dataStart: offset + 4, dataEnd: end });
    offset = end;
  }
  return segments;
}

function buildComSegment(text) {
  const data = Buffer.from(text, 'utf8');
  const out = Buffer.alloc(4 + data.length);
  out[0] = 0xff; out[1] = 0xfe; // COM
  out.writeUInt16BE(data.length + 2, 2);
  data.copy(out, 4);
  return out;
}

function comText(buffer, seg) {
  return buffer.toString('utf8', seg.dataStart, seg.dataEnd);
}

/** Embed the AIGC payload in a JPEG COM segment right after SOI. Replaces any existing AIGC COM. Returns a new Buffer. */
export function writeJpegLabel(buffer, payload) {
  if (!isJpeg(buffer)) throw new Error('Not a JPEG file');
  const segments = parseSegments(buffer);
  const stale = segments.filter(
    (seg) => seg.marker === 0xfe && comText(buffer, seg).startsWith(MARKER_PREFIX),
  );
  const label = buildComSegment(MARKER_PREFIX + JSON.stringify(payload));
  let out = Buffer.concat([buffer.subarray(0, 2), label]);
  let cursor = 2;
  for (const seg of segments) {
    if (stale.includes(seg)) { cursor = seg.end; continue; }
    out = Buffer.concat([out, buffer.subarray(cursor, seg.end)]);
    cursor = seg.end;
  }
  out = Buffer.concat([out, buffer.subarray(cursor)]);
  return out;
}

/** Read the AIGC payload from a JPEG, or null when absent / unparsable. */
export function readJpegLabel(buffer) {
  if (!isJpeg(buffer)) return null;
  for (const seg of parseSegments(buffer)) {
    if (seg.marker !== 0xfe) continue;
    const text = comText(buffer, seg);
    if (text.startsWith(MARKER_PREFIX)) {
      try { return JSON.parse(text.slice(MARKER_PREFIX.length)); } catch { return null; }
    }
  }
  return null;
}
