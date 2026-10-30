import { mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const SOURCE_DIR = process.env.ASSET_SRC || 'D:/Pictures/万圣节游戏素材';
const OUTPUT_DIR = path.resolve('public/assets');
const TRIM_PADDING = 4;

const ASSETS = [
  { out: 'basket.png', src: '装糖果的篮子.png', max: 340 },
  { out: 'basket-full.png', src: '装满糖果的篮子.png', max: 360 },
  { out: 'bomb.png', src: '炸弹.png', max: 150 },
  { out: 'heart.png', src: '生命值.png', max: 96 },
  { out: 'candy-pumpkin.png', src: '南瓜棒棒糖.png', max: 120 },
  { out: 'candy-ghost.png', src: '幽灵硬糖.png', max: 120 },
  { out: 'candy-purple.png', src: '紫色糖果.png', max: 120 },
  { out: 'candy-skull.png', src: '骷髅糖果.png', max: 120 },
  { out: 'cat-head.png', src: '头.png', max: 280 },
  { out: 'cat-body.png', src: '身体.png', max: 260 },
  { out: 'cat-full.png', src: '全身参考图.png', max: 420 },
];

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function ensureSource() {
  try {
    await access(SOURCE_DIR);
  } catch {
    throw new Error(
      `找不到素材目录：${SOURCE_DIR}\n` +
        '请把素材放进该目录，或用环境变量 ASSET_SRC 指定其他目录后重试。',
    );
  }
}

async function prepareOne({ out, src, max }) {
  const input = path.join(SOURCE_DIR, src);
  await access(input).catch(() => {
    throw new Error(`缺少素材文件：${input}`);
  });

  const output = path.join(OUTPUT_DIR, out);
  const info = await sharp(input)
    .ensureAlpha()
    .trim({ background: transparent, threshold: 1 })
    .extend({
      top: TRIM_PADDING,
      bottom: TRIM_PADDING,
      left: TRIM_PADDING,
      right: TRIM_PADDING,
      background: transparent,
    })
    .resize({
      width: max,
      height: max,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);

  console.log(`  ${out.padEnd(20)} ${String(info.width).padStart(4)}×${String(info.height).padEnd(4)}  ${(info.size / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log(`素材源目录：${SOURCE_DIR}`);
  console.log(`输出目录：${OUTPUT_DIR}`);

  await ensureSource();
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const asset of ASSETS) {
    await prepareOne(asset);
  }

  console.log(`\n完成，共处理 ${ASSETS.length} 张素材。`);
}

main().catch((error) => {
  console.error(`\n素材处理失败：${error.message}`);
  process.exitCode = 1;
});
