import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  labelImage, readImageLabel, verifyImageLabel,
  explicitLabelSpec, buildSvgOverlay, validatePayload, buildPayload,
} from '../src/index.js';

// 1x1 transparent PNG
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

// Structurally valid JPEG segment stream (SOI + APP0/JFIF + SOS + EOI) for segment-level tests
const JPEG_FIXTURE = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from([0xff, 0xe0, 0x00, 0x10]),
  Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'latin1'),
  Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]),
  Buffer.from([0x00]),
  Buffer.from([0xff, 0xd9]),
]);

const OPTS = { providerName: '示例科技有限公司', providerCode: '91310000MA1EXAMPLE' };

test('PNG: label round-trip preserves payload', () => {
  const { buffer, payload } = labelImage(PNG_1PX, OPTS);
  const read = readImageLabel(buffer);
  assert.equal(read.ContentID, payload.ContentID);
  assert.equal(read.ProviderName, OPTS.providerName);
  assert.equal(read.ProviderCode, OPTS.providerCode);
  assert.equal(read.Label, 'AIGC');
});

test('PNG: re-labeling replaces instead of stacking', () => {
  const first = labelImage(PNG_1PX, OPTS).buffer;
  const second = labelImage(first, OPTS);
  const count = second.buffer.toString('latin1').split('AIGC').length - 1;
  assert.equal(count, 2); // one keyword + one "Label":"AIGC" value in JSON
  assert.notEqual(second.payload.ContentID, readImageLabel(first).ContentID);
});

test('PNG: original image chunks survive (file still starts with signature, ends with IEND)', () => {
  const { buffer } = labelImage(PNG_1PX, OPTS);
  assert.equal(buffer.subarray(buffer.length - 12).toString('latin1', 4, 8), 'IEND');
});

test('JPEG: label round-trip preserves payload', () => {
  const { buffer, payload } = labelImage(JPEG_FIXTURE, OPTS);
  const read = readImageLabel(buffer);
  assert.equal(read.ContentID, payload.ContentID);
  assert.equal(read.ProviderName, OPTS.providerName);
});

test('JPEG: re-labeling replaces instead of stacking', () => {
  const first = labelImage(JPEG_FIXTURE, OPTS).buffer;
  const second = labelImage(first, OPTS).buffer;
  const markers = second.toString('latin1').split('AIGC:').length - 1;
  assert.equal(markers, 1);
});

test('unlabeled images verify as incomplete', () => {
  assert.equal(verifyImageLabel(PNG_1PX).ok, false);
  assert.equal(readImageLabel(PNG_1PX), null);
});

test('labeled images verify as complete', () => {
  const { buffer } = labelImage(PNG_1PX, OPTS);
  const result = verifyImageLabel(buffer);
  assert.equal(result.ok, true);
});

test('payload validation requires provider and content ID', () => {
  assert.equal(validatePayload(buildPayload(OPTS)).ok, true);
  assert.equal(validatePayload({ Label: 'AIGC' }).ok, false);
  assert.throws(() => labelImage(PNG_1PX, {}), /Incomplete label payload/);
});

test('explicit label: font size is at least 5% of the shortest side', () => {
  const spec = explicitLabelSpec({ width: 1080, height: 1440, text: 'AI生成' });
  assert.ok(spec.fontSize >= 54);
  assert.equal(spec.meetsMinHeight, true);
  assert.ok(spec.box.x + spec.box.width <= 1080);
  assert.ok(spec.box.y + spec.box.height <= 1440);
});

test('explicit label: SVG overlay carries the text and canvas size', () => {
  const svg = buildSvgOverlay({ width: 800, height: 600, text: 'AI生成' });
  assert.match(svg, /width="800"/);
  assert.match(svg, /AI生成/);
});

test('unsupported formats are rejected clearly', () => {
  assert.throws(() => labelImage(Buffer.from('GIF89a'), OPTS), /Unsupported image format/);
});
