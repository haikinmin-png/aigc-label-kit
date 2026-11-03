# aigc-label-kit

**把 AI 生成内容标识做进文件里，而不是只做在界面上。**

[English](README.md)

自 2025 年 9 月 1 日起，《人工智能生成合成内容标识办法》与国家标准
GB 45438-2025 要求 AI 生成合成内容必须带两类标识：

1. **显式标识**：用户能看见的标识（如“AI生成”），要烧进图片本身，
   高度不低于图片最短边的 5%；
2. **隐式标识**：写在文件元数据里的标识，至少包含生成合成内容属性信息、
   服务提供者名称、服务提供者编码、内容编号。

多数团队只做了界面上的角标就停了。但用户一下载、一截图、一转发，
角标就没了——而标识义务在**服务提供者（你的公司）**身上，
不会因为你调了第三方 API 就转移。

`aigc-label-kit` 专门做文件层这一段，零运行时依赖：

- 📎 **隐式标识**：PNG（iTXt 块）与 JPEG（COM 段）的写入 / 读取 / 校验
- 🏷️ **显式标识规格 + SVG 覆盖层**：按 ≥5% 规则算好尺寸位置，
  可直接喂给 sharp / jimp / canvas 合成进像素
- ✅ **字段校验**：按 GB 45438-2025 必填要素检查标识是否完整
- ☁️ **微信云函数示例**：生成图片在可分享 / 导出前先打标识
- 🔍 **CLI**：在流水线里批量打标、抽检、审计

## 安装

```bash
npm install aigc-label-kit
```

（也可以直接拷贝 `src/`——纯 ESM、零依赖，Node ≥ 18。）

## 快速上手

```js
import { labelImage, verifyImageLabel } from 'aigc-label-kit';

const { buffer, payload } = labelImage(imageBuffer, {
  providerName: '某某科技有限公司',   // 服务提供者 = 你的公司，不是 API 厂商
  providerCode: '9131...',            // 如统一社会信用代码
});

// 把 payload.ContentID 和生成任务一起存库；对外只发 buffer，不要发原图
verifyImageLabel(buffer).ok; // true
```

命令行：

```bash
npx aigc-label write poster.png --provider-name "某某科技有限公司" --provider-code 9131...
npx aigc-label verify poster.png
npx aigc-label read poster.png
```

## 显式标识（烧进像素）

```js
import { buildSvgOverlay } from 'aigc-label-kit';

const svg = buildSvgOverlay({ width: 1080, height: 1440, text: 'AI生成' });
// 用 sharp / jimp / canvas 把 svg 合成到图片上后再导出
```

完整示例见 `examples/wechat-cloud-function/`：包含基于 sharp 的烧图代码，
以及一个把云存储里每张生成图都打上标识的 `applyLabel` 云函数。

## 与法规的对应关系

`docs/standard-mapping.md` 把《标识办法》和 GB 45438-2025 §6.1 的每项要求
逐条对应到本库的字段与载体，并说明为什么元数据里的“服务提供者”必须写
你自己的公司。

## 路线图

WebP / MP4 / MP3 隐式标识、JPEG 的 XMP 载体、C2PA 互通说明、
各平台转码后标识留存检测。见 `docs/roadmap.md`。

## 参与贡献

欢迎 PR 和 Issue——尤其是新格式载体，以及“哪个平台 / 哪种转码把标识
弄丢了”的真实案例。见 `CONTRIBUTING.md`。

## 许可证

MIT
