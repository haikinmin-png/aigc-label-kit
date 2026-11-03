#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { labelImage, readImageLabel, verifyImageLabel } from '../src/index.js';

const [command, file, ...rest] = process.argv.slice(2);

function flag(name) {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
}

function usage() {
  console.log(`aigc-label — implicit AIGC metadata labels for images (PNG / JPEG)

Usage:
  aigc-label write <file> --provider-name <name> [--provider-code <code>] [--out <file>]
  aigc-label read <file>     Print the embedded AIGC payload as JSON
  aigc-label verify <file>   Exit 0 when a complete label is present, 1 otherwise`);
}

if (!command || !file || command === '--help') { usage(); process.exit(command ? 0 : 1); }

const buffer = await readFile(file);

if (command === 'write') {
  const { buffer: out, payload } = labelImage(buffer, {
    providerName: flag('provider-name'),
    providerCode: flag('provider-code'),
  });
  const target = flag('out') ?? file;
  await writeFile(target, out);
  console.log(`Labeled ${target}  ContentID=${payload.ContentID}`);
} else if (command === 'read') {
  const payload = readImageLabel(buffer);
  console.log(payload ? JSON.stringify(payload, null, 2) : 'No AIGC label found');
  process.exit(payload ? 0 : 1);
} else if (command === 'verify') {
  const result = verifyImageLabel(buffer);
  console.log(result.ok ? `OK: complete AIGC label (ContentID=${result.payload.ContentID})` : `Incomplete: missing ${result.missing.join(', ')}`);
  process.exit(result.ok ? 0 : 1);
} else {
  usage();
  process.exit(1);
}
