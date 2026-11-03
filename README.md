# aigc-label-kit

**Label AI-generated content the way regulators actually require — in the file, not just in the UI.**

[中文说明](README.zh-CN.md)

Since 2025-09-01, China's 《人工智能生成合成内容标识办法》 and GB 45438-2025 require
AI-generated content to carry two labels:

1. an **explicit label** users can see (e.g. “AI生成”), burned into the image at
   no less than 5% of its shortest side, and
2. an **implicit label** inside the file metadata: content attributes,
   service-provider name and code, and a unique content ID.

Most teams ship a UI badge and stop there. The badge vanishes the moment a
user downloads, screenshots, or re-uploads the file — and the obligation
stays with **you, the service provider**, not with the model API you called.

`aigc-label-kit` does the file-level part, with zero runtime dependencies:

- 📎 **Implicit labels** for PNG (`iTXt`) and JPEG (`COM`) — write, read, verify
- 🏷️ **Explicit-label spec + SVG overlay** sized to the ≥5% rule, ready to
  composite with sharp / jimp / canvas
- ✅ **Payload validation** against the GB 45438-2025 required field set
- ☁️ **WeChat cloud-function example** — label every generated image before
  it can be shared or exported
- 🔍 **CLI** to label, inspect, and audit files in pipelines

## Install

```bash
npm install aigc-label-kit
```

(Or copy `src/` — it is dependency-free ESM, Node ≥ 18.)

## Quick start

```js
import { labelImage, verifyImageLabel } from 'aigc-label-kit';

const { buffer, payload } = labelImage(imageBuffer, {
  providerName: 'Your Company Ltd.',   // the service provider — your company
  providerCode: '9131...',             // e.g. unified social credit code
});

// store payload.ContentID with your generation task; serve `buffer`, not the original
verifyImageLabel(buffer).ok; // true
```

CLI:

```bash
npx aigc-label write poster.png --provider-name "Your Company Ltd." --provider-code 9131...
npx aigc-label verify poster.png
npx aigc-label read poster.png
```

## Explicit (visible) labels

```js
import { buildSvgOverlay } from 'aigc-label-kit';

const svg = buildSvgOverlay({ width: 1080, height: 1440, text: 'AI生成' });
// composite `svg` over the image with sharp/jimp/canvas before export
```

See `examples/wechat-cloud-function/` for a complete sharp-based burn-in
snippet and an `applyLabel` cloud function that labels every generated
image in cloud storage.

## How it maps to the rules

`docs/standard-mapping.md` maps each requirement of the Measures and
GB 45438-2025 §6.1 to the kit's payload fields and carriers — including why
the "service provider" in the metadata is your own company, not your AI
vendor.

## Roadmap

WebP / MP4 / MP3 implicit labels, XMP carrier for JPEG, C2PA interop notes,
label-preservation checks across platform re-encodes. See `docs/roadmap.md`.

## Contributing

PRs and issue reports are welcome — especially new format carriers and
real-world label-stripping reports. See `CONTRIBUTING.md`.

## License

MIT
