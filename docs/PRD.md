# 万圣夜糖果雨 · 产品需求文档（PRD）

- 版本：v1.0
- 日期：2026-10-31
- 状态：v1.0 已实现
- 项目路径：`candy-rain/`

---

## 1. 项目概述

### 1.1 一句话描述

一款手绘风格的万圣夜休闲接物小游戏：移动小南瓜狐抱着的南瓜桶接住从天而降的糖果，避开炸弹，在越来越快的糖果雨里刷新最高分。

### 1.2 目标

- 打开页面 10 秒内能理解玩法并开始游戏。
- 单局时长约 40–90 秒，失败后愿意立刻点「再来」。
- 桌面端（鼠标悬停跟随）与移动端（手指拖动）体验一致、流畅。
- 视觉统一为「手绘蜡笔 + 万圣夜」，主色橙色 `#E95620`，搭配白色、黑色、夜蓝与点缀紫。

### 1.3 技术栈

| 项目 | 选型 |
| --- | --- |
| 运行时 | Node.js 20+ |
| 包管理器 | pnpm |
| 构建 / 开发服务器 | Vite 7 |
| 语言 | 原生 JavaScript（ES Modules），不使用前端框架 |
| 渲染 | Canvas 2D（游戏画面）+ DOM / CSS（首页、HUD、弹窗） |
| 音频 | Web Audio API 合成音效，无外部音频文件 |
| 依赖 | 仅 `vite`（dev）与 `sharp`（素材预处理，dev） |

### 1.4 非目标（本期不做）

- 账号体系、服务端排行榜、多人模式。
- 多关卡、Boss、道具商店、皮肤系统。
- 存档（仅通过 `localStorage` 记录最高分）。
- 广告、付费、埋点。

---

## 2. 视觉规范

### 2.1 色板

| 名称 | 色值 | 用途 |
| --- | --- | --- |
| 主橙 | `#E95620` | 主按钮、标题光晕、强调数值、面板描边 |
| 亮橙 | `#FF8A3D` | 高光、hover、发光内层 |
| 深橙 | `#B93B10` | 按钮按下、投影、暗部 |
| 深夜黑 | `#05070F` | 页面底色、文字描边、遮罩 |
| 夜蓝 | `#0A1230` | 开始屏渐变起始色 |
| 夜蓝浅 | `#101B45` | 卡片、光晕 |
| 奶油白 | `#FFF5E6` | 正文文字 |
| 纯白 | `#FFFFFF` | 标题高光、分数 |
| 幽灵紫 | `#8B3FE8` | 连击、点缀、糖果高光 |
| 酸橙绿 | `#A3D65C` | 点缀 |
| 血红 | `#D62828` | 炸弹命中、受伤提示 |

### 2.2 字体

- 展示字体：`"YouYuan", "幼圆", "Comic Sans MS", "Microsoft YaHei", sans-serif`（圆润、手绘感，Windows 自带幼圆）。
- 正文字体：`system-ui, "Segoe UI", "Microsoft YaHei", sans-serif`。
- 数字使用 `font-variant-numeric: tabular-nums`，避免分数跳动。

### 2.3 图形语言

- 素材为手绘蜡笔风、粗黑描边、贴纸感；UI 沿用粗描边 + 圆角 + 实心橙色块。
- 发光用多层 `text-shadow` / `box-shadow`，避免大面积高斯模糊。
- 装饰元素（蝙蝠、南瓜）使用内联 SVG，保持与素材一致的粗线条。

### 2.4 动效原则

- 轻盈、有弹性；统一缓动 `cubic-bezier(.22, 1, .36, 1)`。
- 标题缓慢闪烁（4s 循环），不是高频闪烁。
- 尊重 `prefers-reduced-motion: reduce`：停止装饰飞行、标题闪烁与屏幕震动。

---

## 3. 页面与状态机

```
BOOT（预加载素材）
  └─> READY（开始屏幕，装饰动画循环）
        └─ [点击「开始游戏」] ─> PLAYING（画布 + HUD）
              └─ [生命归零，900ms 死亡动画] ─> OVER（游戏结束弹窗）
                    └─ [点击「再来」] ─> PLAYING（重置所有状态）
```

| 状态 | 显示 | 说明 |
| --- | --- | --- |
| BOOT | 深色加载画面（南瓜灯 + 进度） | 预加载 11 张图片，完成后进入 READY |
| READY | 开始屏幕 | 按钮可用，文案「开始游戏」 |
| PLAYING | 画布 + HUD | 开始屏幕隐藏，输入接管 |
| OVER | 游戏结束弹窗 | 画布定格在最后一帧，HUD 仍可见 |

页面结构（`index.html` 提供容器，各 UI 模块渲染内容）：

```
#app
├── #start-screen     开始屏幕（含装饰）
├── #game-screen      游戏屏幕
│   └── #stage
│       ├── #game-canvas
│       └── #hud
└── #game-over-layer  游戏结束弹窗容器
```

---

## 4. 开始屏幕

### 4.1 背景

- 全屏线性渐变：顶部夜蓝 `#0A1230` → 底部深夜黑 `#05070F`，叠加径向暗角与低密度星点。
- 星点可用 CSS 多层 `radial-gradient` 或少量绝对定位小圆点，禁止高频闪烁（≤ 2 次/秒）。
- 画面底部有淡淡的雾气/山丘剪影，增强层次。

### 4.2 内容与层级（自上而下居中）

1. **主标题**「万圣夜糖果雨」
   - `<h1>`，字号 `clamp(2.6rem, 8vw, 5.4rem)`，展示字体，字重 900，字距 `0.04em`。
   - 白色主体 + 黑色粗描边 + 橙色外发光；4s 循环的「呼吸式」亮度变化（`opacity` / `text-shadow`），模拟南瓜灯忽明忽暗。
   - 入场动画：轻微上浮 + 缩放淡入（600ms）。
2. **规则提示**「左右移动篮子接住更多糖果，避开炸弹」
   - 奶油白 84% 不透明度，`clamp(0.95rem, 2.4vw, 1.15rem)`，字距 `0.08em`。
3. **次要提示**「移动鼠标或手指控制篮子 · 漏接不扣分」
   - 更小、更淡（60%）；文案为「移动鼠标或手指控制篮子」。
4. **主按钮**「开始游戏」
   - 背景 `#E95620`，白色粗体，药丸圆角，最小高度 56px，左右内边距 ≥ 40px。
   - 常态带橙色外发光；hover 提亮至 `#FF8A3D` 并上浮 2px；active 下沉；focus-visible 有白色内描边 + 橙色外环。
   - 禁用态（加载中）：降低饱和度、显示「加载中 42%」。
5. **页脚小字**「2026 万圣夜 · 不给糖就捣蛋」

### 4.3 装饰动画

- **蝙蝠 3–5 只**：内联 SVG（粗黑描边 + 橙色小眼睛），分布在标题两侧与底部。动画路径为水平往返 + 正弦上下浮动 + 轻微旋转，周期 7–14s，不同延迟，营造「轻轻飞舞」。
- **南瓜 2–3 个**：内联 SVG 小南瓜，分布在左右下角。上下弹跳（bounce）或左右摇摆，周期 2.4–4s，幅度 8–16px。
- **糖果漂浮**：少量糖果小图（复用 `candy-*.png`）缓慢漂浮、旋转，透明度 0.5–0.8，不遮挡按钮。
- 所有装饰 `pointer-events: none`，不进入 Tab 顺序，`aria-hidden="true"`。
- `< 600px` 时减少装饰数量（蝙蝠 ≤ 2、南瓜 ≤ 2）并降低幅度。

---

## 5. 游戏玩法

### 5.1 画布与布局

- 逻辑分辨率 **960 × 600**（16:10），所有游戏坐标基于此。
- `stage` 在视口中居中，宽度取 `min(1100px, 100vw - 32px, (100dvh - 120px) * 1.6)`，保持 16:10。
- Canvas 按 `devicePixelRatio`（上限 2）缩放，CSS 尺寸 100%，绘制始终使用逻辑坐标。
- 游戏画面自上而下：夜空渐变 → 月亮与星星 → 远景剪影（墓园/房屋）→ 雾气 → 地面 → 角色（猫头 / 双腿）→ 掉落物 → 篮子 → 粒子 → 前景暗角。角色位于掉落物之后、篮子之前，保证糖果下落过程始终可见。
- HUD 覆盖在画布上方，`pointer-events: none`，仅按钮可交互；HUD 高度约 84px，不参与碰撞判定。

### 5.2 篮子（角色）

- 角色由「头」「身体」与「装糖果的篮子」组合而成：猫头在桶沿上方、双腿在桶底下方，整体呈抱桶姿势随篮子移动；头与腿按参考图的视觉中心（眼睛中心 / 腿缝中心）对齐，而不是按图片边界居中。接住第一颗糖果后换成「装满糖果的篮子」并保持。
- 初始中心 x = 480，接取区 y 范围 428–518，显示宽度 170px。
- 角色比例按参考图标定：头宽约为桶宽的 1.24 倍，腿在桶下露出约 0.51 个桶宽；南瓜桶保持素材原始比例，不纵向压扁。
- 移动方式：
  - 鼠标 / 触控笔：悬停即跟随，无需按住；篮子中心平滑跟随指针 x，指数插值系数 12/s，限制在 `[90, 870]`。
  - 触摸：按住并滑动手指。
  - 键盘：← → / A D，速度 620 px/s。键盘输入后由键盘接管，直到鼠标再次移动，避免键鼠冲突。
- 接住第一颗糖果后，篮子保持「装满糖果的篮子」造型（与全身参考图一致）；接住瞬间轻微上跳 4px 并短暂停留满桶状态。
- 受伤时：篮子闪烁（透明度 0.4–1 循环）1.2s。

### 5.3 掉落物

| 类型 | 素材键 | 分值 | 生成权重 | 显示尺寸（高度） | 效果 |
| --- | --- | --- | --- | --- | --- |
| 南瓜棒棒糖 | `candyPumpkin` | 10 | 30 | 84px | +分数 |
| 幽灵硬糖 | `candyGhost` | 15 | 26 | 108px | +分数 |
| 紫色糖果 | `candyPurple` | 20 | 22 | 78px | +分数 |
| 骷髅糖果 | `candySkull` | 25 | 22 | 54px | +分数 |
| 炸弹 | `bomb` | — | 16% 起，最高 30% | 92px | 生命 -1，连击清零 |
| 爱心 | `heart` | — | 4%（生命未满且距上次爱心 ≥15s） | 52px | 生命 +1（上限 3） |

- 生成位置：x ∈ [70, 890]，y = -90；向下初速见 5.6。
- 每个掉落物带 ±20 px/s 水平漂移、±8px 正弦横向摆动、±14° 旋转，视觉上更像被风吹落。
- 炸弹不闪烁、不旋转过快，保持可辨认。
- 掉落物超出底部（y > 680）移除；糖果漏接不扣分，但会中断连击并重置倍率。

### 5.4 碰撞判定

- 以掉落物中心点判断：`|item.x - basket.x| <= 68` 且 `item.y` 在 `[428, 514]`（并考虑物品半径的宽容度 ±8px）。
- 每帧对一个掉落物最多判定一次；命中后立即移除并触发效果。
- 判定偏「宽容」：优先让玩家觉得接住了。

### 5.5 计分与连击

- 单颗得分 = 基础分 × 倍率。
- 每连续接住 5 颗糖果，倍率 +1，上限 ×4。
- 炸弹命中：倍率重置为 ×1、连击清零。
- 漏接糖果：不扣分，但连击清零、倍率回到 ×1。
- HUD 从连续接住 2 颗糖果起显示「连击 N」；倍率 > 1 时显示「连击 N · ×M」。弹出动画在连击数或倍率提升时播放。
- 接住时在命中位置飘出 `+N` 白色描边文字，并爆出该糖果主色的星形粒子。

### 5.6 难度曲线

以本局已进行时间 `t`（秒）计算：

| 参数 | 公式 | 范围 |
| --- | --- | --- |
| 生成间隔 | `950 - 7 × t` ms | 最小 380ms |
| 下落速度 | `190 + 4.2 × t` px/s | 最高 430 px/s |
| 炸弹概率 | `0.16 + 0.0018 × t` | 最高 0.30 |
| 爱心概率 | 生命 < 3 且距上次爱心 ≥15s 时为 0.04 | 否则 0 |

- 生成使用带权随机（糖果权重之和 100，炸弹/爱心单独判定）。
- 连续生成同一种糖果不超过 3 次（避免视觉单调）。

### 5.7 生命、受伤与结束

- 初始生命 3，上限 3。
- 炸弹命中：生命 -1，屏幕震动 8px / 320ms，全屏红色闪光（alpha 0.25，180ms），连击清零，受伤无敌 1.2s（期间不会再被炸弹命中）。
- 生命归零：停止生成，播放 900ms 死亡动画（篮子抖动、糖果散落、画面渐暗），随后触发 `onGameOver`。
- 最高分保存在 `localStorage`，键名 `candy-rain:best`；读取失败时按 0 处理。
- 页面 `visibilitychange` 隐藏时自动暂停（暂停 rAF 计时，恢复后不补偿时间）。

### 5.8 开始与重开

- 点击「开始游戏」：隐藏开始屏幕，显示游戏屏幕，重置分数 / 生命 / 连击 / 计时器 / 掉落物，立即开始。
- 点击「再来」：关闭弹窗，重置并开始新一局，无需刷新页面。

---

## 6. 游戏结束弹窗

- 遮罩：`rgba(5, 7, 15, 0.72)` + `backdrop-filter: blur(6px)`，淡入 200ms。
- 面板：深色玻璃（`#101B45` 85%）、2px 橙色描边、圆角 28px、橙色外发光、最大宽度 420px，带轻微弹入动画（scale 0.92 → 1）。
- 内容：
  1. 标题「游戏结束」——主橙、发光、展示字体。
  2. 副标题「不给糖就捣蛋！」——奶油白。
  3. 本局分数：超大白色数字，前缀「分数」。
  4. 最高分：小号「最高分 N」；刷新纪录时显示橙色徽章「新纪录！」。
  5. 本局统计：「接住 N 颗糖果 · 坚持 mm:ss」。
  6. 主按钮「再来」——主橙，点击重开。
- 打开时焦点自动移到「再来」按钮；弹窗 `role="dialog"` `aria-modal="true"`，标题通过 `aria-labelledby` 关联。
- 弹窗不提供「关闭」；必须点「再来」继续。

---

## 7. HUD 规格

| 区域 | 内容 | 说明 |
| --- | --- | --- |
| 左上第一行 | 分数卡：南瓜棒棒糖小图标 + 数字 | 数字白色、粗体、等宽数字；数字变化时轻微弹跳 |
| 左上第二行 | 角色卡：`catHead` 圆形头像 44px + 「小南瓜狐」+ 称号「糖果猎人」 | 半透明深色底、细橙边；窄屏隐藏称号 |
| 左上第三行 | 连击标签「连击 N · ×M」 | 连续接住 ≥2 颗起显示，紫色渐变；连击 / 倍率提升时弹出 |
| 右上 | 生命：3 颗 `heart` 图标 | 失去的生命置灰、透明度 0.28；受伤时整组抖动 |
| 右上第二行 | 静音切换按钮 + 最高分 `最高 N` | 按钮 40×40，aria-label 随状态变化 |
| 角色头顶上方 | 操作提示「移动鼠标控制篮子」 | 桌面开局显示 3s 后淡出；移动端隐藏（以开始屏说明为准） |
| 受伤 | 画面边缘红色渐晕 | 与游戏内红闪同步 |

- HUD 采用 `clamp()` 缩放，`< 720px` 时压缩内边距、隐藏称号与最高分文字。
- 分数使用 `aria-live="polite"` 的隐藏文本，避免每帧读屏。

---

## 8. 技术方案

### 8.1 目录结构

```
candy-rain/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.js
├── README.md
├── docs/
│   └── PRD.md
├── scripts/
│   └── prepare-assets.mjs      # 素材裁剪 / 缩放管线
├── public/
│   └── assets/                 # 由 pnpm assets 生成
├── src/
│   ├── main.js                 # 组装与页面流程
│   ├── styles/
│   │   └── base.css            # 设计变量、重置、通用按钮/面板/舞台
│   ├── game/
│   │   ├── config.js           # 常量、掉落物定义、难度参数
│   │   ├── assets.js           # 图片清单与预加载
│   │   ├── audio.js            # WebAudio 合成音效
│   │   ├── input.js            # 指针 / 键盘输入
│   │   ├── entities.js         # 篮子、掉落物：创建 / 更新 / 绘制
│   │   ├── particles.js        # 粒子与飘字
│   │   ├── background.js       # 游戏内夜空背景
│   │   └── game.js             # 主循环、生成、碰撞、计分、结束
│   └── ui/
│       ├── startScreen.js
│       ├── start-screen.css
│       ├── hud.js
│       ├── hud.css
│       ├── gameOver.js
│       └── game-over.css
└── ...
```

### 8.2 模块契约

> 所有模块使用 ES Module，命名导出；不得修改他人负责的文件。

#### `src/game/config.js`

```js
export const GAME = {
  width: 960,
  height: 600,
  basketY: 401,        // 篮子显示顶部 y
  basketWidth: 170,
  catcherHalfWidth: 68,
  catcherTop: 428,
  catcherBottom: 514,
  maxLives: 3,
  invulnerableMs: 1200,
  deathMs: 900,
  hudHeight: 84,
};

export const COLORS = {
  orange: '#E95620', orangeBright: '#FF8A3D', orangeDeep: '#B93B10',
  night: '#05070F', nightBlue: '#0A1230', nightSoft: '#101B45',
  cream: '#FFF5E6', white: '#FFFFFF', purple: '#8B3FE8',
  lime: '#A3D65C', red: '#D62828',
};

export const CANDY_DEFS = {
  pumpkin: { key: 'candyPumpkin', points: 10, size: 84, weight: 30, color: '#F07A19' },
  ghost:   { key: 'candyGhost',   points: 15, size: 108, weight: 26, color: '#A3D65C' },
  purple:  { key: 'candyPurple',  points: 20, size: 78, weight: 22, color: '#8B3FE8' },
  skull:   { key: 'candySkull',   points: 25, size: 54, weight: 22, color: '#F5F1E8' },
};

export const BOMB = { key: 'bomb', size: 92 };
export const HEART = { key: 'heart', size: 52 };

export const SCORING = { comboStep: 5, maxMultiplier: 4 };

export const DIFFICULTY = {
  baseSpawnMs: 950, minSpawnMs: 380, spawnRampPerSec: 7,
  baseSpeed: 190, maxSpeed: 430, speedRampPerSec: 4.2,
  bombChanceStart: 0.16, bombChanceMax: 0.3, bombRampPerSec: 0.0018,
  heartChance: 0.04, heartCooldownMs: 15000,
};
```

#### `src/game/assets.js`

```js
export const ASSET_SOURCES = {
  basket: 'assets/basket.png',
  basketFull: 'assets/basket-full.png',
  bomb: 'assets/bomb.png',
  heart: 'assets/heart.png',
  candyPumpkin: 'assets/candy-pumpkin.png',
  candyGhost: 'assets/candy-ghost.png',
  candyPurple: 'assets/candy-purple.png',
  candySkull: 'assets/candy-skull.png',
  catHead: 'assets/cat-head.png',
  catBody: 'assets/cat-body.png',
  catFull: 'assets/cat-full.png',
};

// 返回 Map<string, HTMLImageElement>；任意一张失败时整体 reject
export async function loadAssets({ onProgress } = {}) {}

export function getImage(images, key) {}  // 缺失时返回 null，调用方需容错
```

图片 URL 使用 `import.meta.env.BASE_URL` 拼接，保证部署到子路径可用。

#### `src/game/input.js`

```js
export function createInput({ canvas, width, height }) {
  return {
    position: null,          // 逻辑坐标 x；null 表示尚未交互
    attach(),                // 绑定 pointer / keyboard，首次交互可触发 onFirstInput
    detach(),
    destroy(),
    onFirstInput(cb),        // 用于解锁音频
  };
}
```

- 指针坐标需按 canvas 的 `getBoundingClientRect()` 换算到 960×600 逻辑坐标。
- `touch-action: none`，触摸拖动时阻止页面滚动；按住时使用 setPointerCapture，指针移出画布仍可继续拖动。
- 键盘事件绑定 `window`，输入框聚焦时不拦截。

#### `src/game/audio.js`

```js
export function createAudio() {
  return {
    get muted(), setMuted(value),
    unlock(),                // 用户首次交互时调用，创建 AudioContext
    click(), start(), catch(combo), bomb(), heart(), gameOver(),
  };
}
```

- 全部使用振荡器 + 增益包络合成，音量克制（峰值 ≤ 0.18）。
- AudioContext 不可用或创建失败时静默降级，不抛错。
- 静音时所有播放方法直接返回。

#### `src/game/entities.js`

```js
export function createBasket(images) {
  // { x, y, width, height, targetX, flashMs, invulnerableMs, shakeMs, drawW, drawH }
}

export function updateBasket(basket, dt) {}   // 跟随 basket.targetX

export function drawBasket(ctx, basket, images, time) {}

export function createItem(type, images, { x, y, speed, drift }) {
  // { type, x, y, vx, vy, size, radius, rotation, spin, wobblePhase, wobbleAmp, bornAt }
}

export function updateItem(item, dt, time) {}   // 位置、摆动、旋转

export function drawItem(ctx, item, images, time) {}  // 含投影/光晕

export function hitsBasket(item, basket) {}     // 返回 boolean
```

- 尺寸按 `config.js` 的 `size` 等比缩放素材，保持原始宽高比；`item.radius` 取显示宽度的一半（用于碰撞宽容）。
- 绘制均以 `item.x, item.y` 为中心。

#### `src/game/particles.js`

```js
export function createParticles() {
  return {
    emitCandy(x, y, color),
    emitBomb(x, y),
    emitText(x, y, text, color),
    update(dt),
    draw(ctx),
    clear(),
    get count(),
  };
}
```

- 粒子上限 240，超出时丢弃最旧的；`emitBomb` 额外产生冲击环。
- 飘字上浮并淡出，生命周期 800ms。

#### `src/game/background.js`

```js
export function createBackground({ width, height }) {
  return {
    draw(ctx, time, { shakeX = 0, shakeY = 0, dim = 0 } = {}),
    destroy(),
  };
}
```

- 预生成星星、月亮光晕、远景剪影；`time` 为毫秒。
- 不绘制篮子、掉落物、粒子。

#### `src/game/game.js`

```js
export function createGame({ canvas, images, audio, onHud, onGameOver }) {
  return {
    start(),      // 重置并开始
    stop(),       // 停止循环、解绑输入
    destroy(),
    get state(),  // 'idle' | 'running' | 'paused' | 'over'
    get score(),
  };
}
```

- 内部负责：rAF 循环、dt 上限 50ms、生成、碰撞、计分、粒子、震动、死亡动画、自动暂停。
- `onHud(snapshot)` 每 100ms 最多调用一次，snapshot：
  ```js
  { score, lives, maxLives, combo, multiplier, catchCount, elapsedMs, fullBasket }
  ```
  （最高分由 main 通过 `hud.setBest()` 注入，game 不读 localStorage。）
- `onGameOver({ score, catchCount, elapsedMs })` 在死亡动画结束后调用一次。
- `start()` 可重复调用以重开。

#### `src/ui/startScreen.js`

```js
export function createStartScreen({ mount, images, onStart }) {
  return {
    setProgress(ratio),   // 0..1，更新加载文案
    setReady(ready),      // true → 按钮启用，文案「开始游戏」
    setError(message),    // 加载失败时展示一句错误提示，按钮保持禁用
    show(), hide(), destroy(),
  };
}
```

- `mount` 为 `#start-screen`；模块自行注入全部 DOM 与装饰（含内联 SVG 蝙蝠、南瓜）。
- 点击按钮后调用 `onStart()`，由 main 负责切换画面。

#### `src/ui/hud.js`

```js
export function createHud({ mount, images, muted = false, onToggleMute }) {
  return {
    update(snapshot),     // 幂等；仅在数值变化时更新 DOM
    reset(),
    setBest(score),       // 更新右上角最高分
    show(), hide(),
    setMuted(muted),
    destroy(),
  };
}
```

- 使用 `images.get('heart')`、`images.get('catHead')`、`images.get('candyPumpkin')`。
- 生命变化时播放一次抖动；分数变化时数字弹跳。

#### `src/ui/gameOver.js`

```js
export function createGameOver({ mount, onRestart }) {
  return {
    show({ score, best, isNewBest, catchCount, elapsedMs }),
    hide(), destroy(),
  };
}
```

- `mount` 为 `#game-over-layer`；自行注入遮罩与面板。
- 「再来」按钮点击后调用 `onRestart()`；面板打开时把焦点移入按钮。

### 8.3 素材处理管线

运行 `pnpm assets`（`node scripts/prepare-assets.mjs`）：

1. 默认源目录 `D:\Pictures\万圣节游戏素材`，可用环境变量 `ASSET_SRC` 覆盖。
2. 对每张 PNG：按 alpha 通道裁剪透明边缘（保留 4px 内边距），再等比缩放到目标最大边。
3. 输出到 `public/assets/`，文件名使用下表英文键名；不覆盖未知文件。
4. 使用 `sharp`，压缩级别 9；保留透明通道。

| 输出文件 | 源文件 | 目标最大边 |
| --- | --- | --- |
| `basket.png` | 装糖果的篮子.png | 340 |
| `basket-full.png` | 装满糖果的篮子.png | 360 |
| `bomb.png` | 炸弹.png | 150 |
| `heart.png` | 生命值.png | 96 |
| `candy-pumpkin.png` | 南瓜棒棒糖.png | 120 |
| `candy-ghost.png` | 幽灵硬糖.png | 120 |
| `candy-purple.png` | 紫色糖果.png | 120 |
| `candy-skull.png` | 骷髅糖果.png | 120 |
| `cat-head.png` | 头.png | 280 |
| `cat-body.png` | 身体.png | 260 |
| `cat-full.png` | 全身参考图.png | 420 |

### 8.4 缺失素材与占位策略

以下素材目前没有，开发中用代码占位，不阻塞；补齐后可直接替换：

| 素材 | 用途 | 当前占位 |
| --- | --- | --- |
| `bat.png`（可选） | 首页蝙蝠 | 内联 SVG 蝙蝠 |
| `pumpkin.png`（可选） | 首页装饰南瓜 | 内联 SVG 南瓜 |
| `explosion.png`（可选） | 炸弹爆炸 | Canvas 粒子 + 冲击环 |
| `background.png`（可选） | 游戏背景 | Canvas 程序化夜空 |
| 音效（可选） | 点击 / 接住 / 爆炸 / 结束 | Web Audio 合成 |

---

## 9. 音频

- 首次指针交互或点击按钮时创建 / 恢复 `AudioContext`。
- 音效：
  - 接住糖果：短促上行音（随连击升高音高），≤ 120ms。
  - 炸弹：低频噪声 + 下滑音，≤ 350ms。
  - 爱心：明亮双音。
  - 开始 / 结束：三音小旋律。
  - 按钮点击：短促点击。
- 默认开启；HUD 提供静音按钮，状态保存在内存（不持久化）。
- 不使用自动播放；不请求麦克风等权限。

---

## 10. 响应式与无障碍

- 支持视口宽度 320px–1920px；横屏手机与竖屏手机均可玩。
- 所有按钮最小点击区 44×44px；按钮具备可见的 `:focus-visible` 状态。
- 文字对比度 ≥ 4.5:1（橙色按钮上的白字通过加深底色或加粗保证可读）。
- Canvas 提供 `aria-label`；HUD 分数通过隐藏的 `aria-live="polite"` 文本播报（每 5 秒最多一次）。
- 装饰元素 `aria-hidden="true"`；弹窗有 `role="dialog"` 与焦点管理。
- `prefers-reduced-motion: reduce` 时：关闭标题闪烁、蝙蝠飞行、震屏，仅保留淡入淡出。

---

## 11. 性能

- 目标 60fps；单帧逻辑 + 绘制 < 8ms（中端手机）。
- 同屏掉落物上限 40，粒子上限 240。
- 图片只解码一次；不使用每帧 `drawImage` 以外的滤镜（`ctx.filter` 禁用）。
- DPR 上限 2；窗口 resize 时重建画布尺寸，不重建素材。

---

## 12. 验收标准

- [ ] 页面标题为「万圣夜糖果雨」。
- [ ] 首页为夜蓝到黑的渐变背景，标题发光且缓慢闪烁。
- [ ] 首页包含规则文案「左右移动篮子接住更多糖果，避开炸弹」。
- [ ] 橙色 `#E95620` 的「开始游戏」按钮可点击并进入游戏。
- [ ] 首页蝙蝠轻轻飞舞、南瓜跳跃，动画不遮挡按钮。
- [ ] 点击开始后显示画布与 HUD（分数、生命、角色信息）。
- [ ] 鼠标悬停与触摸拖动都能平滑移动篮子。
- [ ] 四种糖果可接住并加分，炸弹扣命，爱心回血。
- [ ] 生命归零后出现「游戏结束」「不给糖就捣蛋！」与「再来」按钮。
- [ ] 点击「再来」立即开始新一局，分数与生命重置。
- [ ] 最高分在刷新页面后仍保留。
- [ ] 桌面（1440×900）与移动（390×844）下布局不溢出、不遮挡。
- [ ] `pnpm build` 成功，`pnpm preview` 可完整游玩。
- [ ] 控制台无报错、无 404 资源。

---

## 13. 后续迭代

1. 连击特效与全屏糖果雨奖励。
2. 角色皮肤（黑猫、幽灵）、篮子皮肤。
3. 每日挑战与本地排行榜。
4. 音效素材替换合成音、BGM。
5. 成就系统与分享卡片。
