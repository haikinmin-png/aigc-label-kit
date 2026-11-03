/**
 * Explicit (visible) label geometry.
 *
 * 《生成合成内容标识办法》 requires an explicit label on generated images that
 * stays visible and is not trivially small: the implementing standard asks
 * for a label height of at least 5% of the image's shortest side. These
 * helpers compute a compliant label box and render it as an SVG overlay you
 * can composite with sharp / jimp / canvas, so the label is burned into the
 * exported pixels instead of floating in UI chrome (where screenshots and
 * re-uploads would strip it).
 */
const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

export function explicitLabelSpec({ width, height, text = 'AI生成', position = 'bottom-right' } = {}) {
  if (!width || !height) throw new Error('width and height are required');
  if (!POSITIONS.includes(position)) throw new Error(`position must be one of ${POSITIONS.join(', ')}`);
  const shortest = Math.min(width, height);
  const fontSize = Math.max(12, Math.round(shortest * 0.05));
  const paddingX = Math.round(fontSize * 0.6);
  const paddingY = Math.round(fontSize * 0.3);
  // Rough advance widths: CJK glyphs ~1em, latin/digits ~0.55em.
  let textWidth = 0;
  for (const ch of text) textWidth += /[^\x00-\xff]/.test(ch) ? fontSize : fontSize * 0.55;
  const boxWidth = Math.ceil(textWidth) + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;
  const margin = Math.round(shortest * 0.02);
  const x = position.endsWith('right') ? width - boxWidth - margin : margin;
  const y = position.startsWith('bottom') ? height - boxHeight - margin : margin;
  return {
    text, position, fontSize,
    box: { x, y, width: boxWidth, height: boxHeight },
    meetsMinHeight: fontSize >= shortest * 0.05 - 1,
  };
}

/** SVG overlay (positioned absolutely over the image) for compositing pipelines. */
export function buildSvgOverlay({ width, height, text = 'AI生成', position = 'bottom-right' } = {}) {
  const spec = explicitLabelSpec({ width, height, text, position });
  const { x, y, width: w, height: h } = spec.box;
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(h * 0.18)}" fill="rgba(0,0,0,0.55)"/>
  <text x="${x + w / 2}" y="${y + h / 2}" font-size="${spec.fontSize}" fill="#ffffff" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${escaped}</text>
</svg>`;
}
