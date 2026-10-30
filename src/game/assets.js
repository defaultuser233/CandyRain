/**
 * @typedef {Map<string, HTMLImageElement>} ImageMap
 */

const ASSET_SOURCES = {
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

export { ASSET_SOURCES };

/**
 * 并发预加载所有素材图片，返回 Map<key, Image>。
 * 任一图片加载失败则 reject，错误信息包含失败的键和 URL。
 * onProgress(loaded, total) 在每张完成时回调。
 */
export async function loadAssets({ onProgress } = {}) {
  const images = new Map();
  const base = import.meta.env.BASE_URL;
  const entries = Object.entries(ASSET_SOURCES);
  const total = entries.length;
  let loaded = 0;

  const promises = entries.map(([key, path]) => {
    const url = base + path;
    const img = new Image();
    img.decoding = 'async';
    return new Promise((resolve, reject) => {
      img.onload = () => {
        images.set(key, img);
        loaded++;
        onProgress?.(loaded, total);
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`assets.js: failed to load "${key}" at ${url}`));
      };
      img.src = url;
    });
  });

  await Promise.all(promises);
  return images;
}

/**
 * 从图片 Map 中安全获取指定 key 的 Image。
 * 缺失时返回 null，不抛错。
 */
export function getImage(images, key) {
  if (!images || typeof images.get !== 'function') return null;
  return images.get(key) || null;
}