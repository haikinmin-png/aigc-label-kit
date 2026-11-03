# WeChat cloud function example

`applyLabel/` is a drop-in cloud function for mini programs that generate
images with AI (face swap, stylization, photo dance covers, posters…).

Flow: AI vendor returns an image → store it in cloud storage → call
`applyLabel` → serve/share only the labeled file.

## Setup

1. Copy `applyLabel/` into your cloud functions directory and add
   `aigc-label-kit` to its `package.json` dependencies.
2. In the cloud console, set environment variables on the function:
   - `AIGC_PROVIDER_NAME` — your company name (the service provider; this is
     you, not the AI API vendor)
   - `AIGC_PROVIDER_CODE` — your provider code, e.g. unified social credit code
3. Deploy the function, then call it with `{ fileID, taskId }` after each
   generation task completes.

## Burning in the explicit (visible) label

A UI badge is not enough: once users download or screenshot the image, the
label must already be in the pixels. With `sharp` available in the function
(add it as a dependency or a layer):

```js
const sharp = require('sharp');
const { buildSvgOverlay } = require('aigc-label-kit');

async function burnExplicitLabel(imageBuffer, text = 'AI生成') {
  const meta = await sharp(imageBuffer).metadata();
  const svg = buildSvgOverlay({ width: meta.width, height: meta.height, text });
  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
```

Run this before `applyLabel` so the stored file carries both labels:
visible in the pixels, and the implicit payload in the metadata.
