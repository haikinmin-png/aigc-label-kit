# Contributing

Issues and PRs are welcome — especially:

- new file-format carriers (WebP, MP4, MP3) following the existing
  read/write/verify pattern in `src/`
- reports of real-world label stripping (which platform / transform removed
  a label), with a sample file if you can share one
- translations of the docs

Guidelines: zero runtime dependencies, Node >= 18, tests for every carrier
(`npm test`), and keep the payload schema backward compatible — files
already labeled in production must stay readable.
