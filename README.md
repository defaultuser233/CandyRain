# 万圣夜糖果雨

手绘风万圣夜接糖果小游戏：小南瓜狐抱着南瓜桶接住从天而降的糖果，避开炸弹，连击越高分数倍率越高。

- 技术栈：Node.js + pnpm + Vite + 原生 ES Modules + Canvas 2D
- 无前端框架、无运行时依赖
- 支持鼠标悬停跟随、触摸拖动与键盘方向键
- 桌面与移动端自适应
- 手机竖屏使用全屏纵向布局，画布高度按屏幕比例自适应；横屏手机保持 16:10

## 快速开始

```bash
pnpm install
pnpm assets   # 首次运行：从素材源目录生成 public/assets
pnpm dev      # http://localhost:5173
```

生产构建：

```bash
pnpm build
pnpm preview
```

> pnpm 11 需要允许 `esbuild` / `sharp` 运行安装脚本，仓库中的 `pnpm-workspace.yaml` 已通过 `allowBuilds` 配置好。

## 素材管线

`pnpm assets` 会读取：

```
D:\Pictures\万圣节游戏素材
```

对每张 PNG 按透明通道裁剪、等比缩放，输出到 `public/assets/`：

| 输出 | 源文件 | 用途 |
| --- | --- | --- |
| `basket.png` | 装糖果的篮子.png | 篮子常态 |
| `basket-full.png` | 装满糖果的篮子.png | 接住第一颗糖果后保持满桶 |
| `bomb.png` | 炸弹.png | 炸弹 |
| `heart.png` | 生命值.png | 生命 / 回血 |
| `candy-pumpkin.png` | 南瓜棒棒糖.png | 10 分糖果 |
| `candy-ghost.png` | 幽灵硬糖.png | 15 分糖果 |
| `candy-purple.png` | 紫色糖果.png | 20 分糖果 |
| `candy-skull.png` | 骷髅糖果.png | 25 分糖果 |
| `cat-head.png` | 头.png | HUD 角色头像 |
| `cat-body.png` | 身体.png | 角色素材（预留） |
| `cat-full.png` | 全身参考图.png | 角色素材（预留） |

素材目录可用环境变量覆盖：

```bash
# macOS / Linux / Git Bash
ASSET_SRC="D:/path/to/assets" pnpm assets

# Windows PowerShell
$env:ASSET_SRC="D:/path/to/assets"; pnpm assets
```

## 玩法

- 鼠标悬停即可移动南瓜桶，无需按住；触摸设备按住滑动；也可按 ← → / A D。
- 键盘接管后，鼠标需要再次移动才会重新接管，避免键鼠互相抢控制。
- 接住糖果得分：南瓜棒棒糖 10、幽灵硬糖 15、紫色糖果 20、骷髅糖果 25。
- 每连续接住 5 颗糖果，倍率 +1，最高 ×4；炸弹会清空连击。
- 炸弹扣 1 点生命；生命 3 点，归零游戏结束。
- 爱心可回复 1 点生命（生命未满时随机出现）。
- 漏接糖果不扣分，但会中断连击、重置倍率。
- 生成间隔与下落速度随游戏时间提升。
- 最高分保存在 `localStorage` 的 `candy-rain:best`。

## 目录结构

```
.
├── docs/PRD.md                 # 产品需求与接口契约
├── index.html
├── scripts/prepare-assets.mjs  # 素材裁剪 / 缩放
├── public/assets/              # 生成的游戏素材
└── src/
    ├── main.js                 # 页面流程组装
    ├── styles/base.css         # 设计变量、重置、按钮/舞台
    ├── game/
    │   ├── config.js           # 数值与难度曲线
    │   ├── assets.js           # 预加载
    │   ├── audio.js            # WebAudio 合成音效
    │   ├── input.js            # 指针 / 键盘
    │   ├── entities.js         # 篮子与掉落物
    │   ├── particles.js        # 粒子与飘字
    │   ├── background.js       # 程序化夜空
    │   └── game.js             # 主循环、碰撞、计分、结束
    └── ui/
        ├── startScreen.js      # 开始屏幕 + 蝙蝠/南瓜装饰
        ├── hud.js              # 分数 / 生命 / 角色 / 连击
        └── gameOver.js         # 结束弹窗
```

## 当前占位与可选素材

以下素材目前用代码绘制，不阻塞游玩；补齐后可替换：

| 素材 | 当前实现 | 建议规格 |
| --- | --- | --- |
| 蝙蝠 `bat.png` | 内联 SVG 蝙蝠 | 透明 PNG，2:1，≥ 256×128 |
| 装饰南瓜 `pumpkin.png` | 内联 SVG 南瓜 | 透明 PNG，正方形，≥ 256×256 |
| 炸弹爆炸 `explosion.png` | Canvas 粒子 + 冲击环 | 序列帧或单张爆炸图 |
| 游戏背景 `background.png` | Canvas 程序化夜空 / 墓园 | 1920×1200，可平铺或 16:10 |
| 音效 | WebAudio 合成 | 点击、接住、爆炸、爱心、结束 |

如需新增掉落物或角色皮肤，先在 `src/game/config.js` 的 `CANDY_DEFS` 中登记分值与尺寸，再在 `scripts/prepare-assets.mjs` 与 `src/game/assets.js` 中添加映射即可。
