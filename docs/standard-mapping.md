# How the kit maps to the rules

China's 《人工智能生成合成内容标识办法》 (Measures for Labeling AI-Generated
Synthetic Content, in force since 2025-09-01) plus the national standard
GB 45438-2025 《网络安全技术 人工智能生成合成内容标识方法》 require two kinds
of labels on generated content. This kit implements both at the file level.

## Explicit labels (显式标识) — visible to users

Requirement (images): a visible label such as “AI生成” on the generated
image itself, with a height of at least 5% of the image's shortest side,
placed so it survives normal viewing, download and export.

Kit: `explicitLabelSpec()` computes a compliant label box (font size,
padding, position) and `buildSvgOverlay()` renders it for compositing
pipelines (sharp/jimp/canvas). Labels rendered as app UI do **not** count —
they disappear on download — which is why the kit burns the label into the
exported file's pixels.

## Implicit labels (隐式标识) — metadata inside the file

Requirement (GB 45438-2025 §6.1): the file's metadata must carry, at minimum:

| Required element | Kit payload field |
| --- | --- |
| 生成合成内容属性信息 (content is AI generated/synthesized) | `Label: "AIGC"`, `ContentType` |
| 服务提供者名称 (service provider name) | `ProviderName` |
| 服务提供者编码 (service provider code) | `ProviderCode` |
| 内容编号 (content ID) | `ContentID` |

Kit carriers:
- PNG → `iTXt` chunk with keyword `AIGC`, JSON payload (UTF-8 safe)
- JPEG → `COM` segment prefixed `AIGC:`, JSON payload
- WebP / MP4 / MP3 → on the roadmap

Important: the "service provider" is the company operating the service that
faces users — **your company**, not the upstream model API vendor. Calling a
third-party API does not transfer the labeling obligation.

## Also required by the Measures (outside this kit's scope)

- Your user agreement must describe the labeling method and style.
- Do not offer users a "clean" export with labels removed.
- Interactive UIs should show explicit labels in preview/share flows too.
