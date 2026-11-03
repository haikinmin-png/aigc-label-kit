import { crc32 } from './crc32.js';
import { LABEL_KEYWORD } from './payload.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function isPng(buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE);
}

function parseChunks(buffer) {
  const chunks = [];
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) break;
    chunks.push({ type, data: buffer.subarray(dataStart, dataEnd), start: offset, end: dataEnd + 4 });
    offset = dataEnd + 4;
    if (type === 'IEND') break;
  }
  return chunks;
}

function buildChunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(out.subarray(4, 8 + data.length));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

// iTXt: keyword \0 compressionFlag(0) compressionMethod(0) languageTag \0 translatedKeyword \0 text(UTF-8)
function buildITXt(keyword, text) {
  const parts = [
    Buffer.from(keyword, 'latin1'),
    Buffer.from([0, 0, 0]),
    Buffer.from([0]),
    Buffer.from([0]),
    Buffer.from(text, 'utf8'),
  ];
  return buildChunk('iTXt', Buffer.concat(parts));
}

function readTextChunk(chunk) {
  if (chunk.type === 'iTXt') {
    const nul = chunk.data.indexOf(0);
    if (nul < 0) return null;
    const keyword = chunk.data.toString('latin1', 0, nul);
    // skip: compression flag + method (2 bytes), language tag \0, translated keyword \0
    let i = nul + 3;
    const langEnd = chunk.data.indexOf(0, i);
    if (langEnd < 0) return null;
    i = langEnd + 1;
    const transEnd = chunk.data.indexOf(0, i);
    if (transEnd < 0) return null;
    return { keyword, text: chunk.data.toString('utf8', transEnd + 1) };
  }
  if (chunk.type === 'tEXt') {
    const nul = chunk.data.indexOf(0);
    if (nul < 0) return null;
    return {
      keyword: chunk.data.toString('latin1', 0, nul),
      text: chunk.data.toString('latin1', nul + 1),
    };
  }
  return null;
}

/** Embed the AIGC payload as an iTXt chunk. Replaces any existing AIGC chunk. Returns a new Buffer. */
export function writePngLabel(buffer, payload) {
  if (!isPng(buffer)) throw new Error('Not a PNG file');
  const chunks = parseChunks(buffer);
  const kept = [];
  let insertAt = -1;
  chunks.forEach((chunk, idx) => {
    const text = chunk.type === 'iTXt' || chunk.type === 'tEXt' ? readTextChunk(chunk) : null;
    if (text && text.keyword === LABEL_KEYWORD) return; // drop old label
    if (chunk.type === 'IEND') insertAt = kept.length;
    kept.push(idx);
  });
  const labelChunk = buildITXt(LABEL_KEYWORD, JSON.stringify(payload));
  const parts = [PNG_SIGNATURE];
  kept.forEach((idx, position) => {
    if (position === insertAt) parts.push(labelChunk);
    const chunk = chunks[idx];
    parts.push(buffer.subarray(chunk.start, chunk.end));
  });
  if (insertAt === -1) parts.push(labelChunk);
  return Buffer.concat(parts);
}

/** Read the AIGC payload from a PNG, or null when absent / unparsable. */
export function readPngLabel(buffer) {
  if (!isPng(buffer)) return null;
  for (const chunk of parseChunks(buffer)) {
    if (chunk.type !== 'iTXt' && chunk.type !== 'tEXt') continue;
    const text = readTextChunk(chunk);
    if (text && text.keyword === LABEL_KEYWORD) {
      try { return JSON.parse(text.text); } catch { return null; }
    }
  }
  return null;
}
