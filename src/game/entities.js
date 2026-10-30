import { GAME, CANDY_DEFS, BOMB, HEART, COLORS } from './config.js';

const ITEM_KEYS = {
  pumpkin: CANDY_DEFS.pumpkin.key,
  ghost: CANDY_DEFS.ghost.key,
  purple: CANDY_DEFS.purple.key,
  skull: CANDY_DEFS.skull.key,
  bomb: BOMB.key,
  heart: HEART.key,
};

const CANDY_SIZE = {
  pumpkin: CANDY_DEFS.pumpkin.size,
  ghost: CANDY_DEFS.ghost.size,
  purple: CANDY_DEFS.purple.size,
  skull: CANDY_DEFS.skull.size,
  bomb: BOMB.size,
  heart: HEART.size,
};

const CANDY_COLOR = {
  pumpkin: CANDY_DEFS.pumpkin.color,
  ghost: CANDY_DEFS.ghost.color,
  purple: CANDY_DEFS.purple.color,
  skull: CANDY_DEFS.skull.color,
  bomb: COLORS.red,
  heart: COLORS.orangeBright,
};

const MIN_X = 90;
const MAX_X = GAME.width - 90;

function readImage(images, key) {
  if (!images) return null;
  if (typeof images.get === 'function') return images.get(key) || null;
  return images[key] || null;
}

function imageRatio(image) {
  if (!image || !image.naturalWidth || !image.naturalHeight) return 0.72;
  return image.naturalHeight / image.naturalWidth;
}

export function createBasket(images) {
  const image = readImage(images, 'basket');
  const drawW = GAME.basketWidth;
  // 空桶保持素材原始比例，避免压扁；满桶同样按原始比例绘制
  const drawH = drawW * imageRatio(image);

  return {
    x: GAME.width / 2,
    y: GAME.basketY,
    width: drawW,
    height: drawH,
    drawW,
    drawH,
    targetX: GAME.width / 2,
    catchFlashMs: 0,
    invulnerableMs: 0,
    shakeMs: 0,
    hopMs: 0,
    hasCandy: false,
  };
}

export function updateBasket(basket, dt) {
  const smooth = 1 - Math.exp(-12 * dt);
  basket.x += (basket.targetX - basket.x) * smooth;
  basket.x = Math.min(MAX_X, Math.max(MIN_X, basket.x));

  basket.catchFlashMs = Math.max(0, basket.catchFlashMs - dt * 1000);
  basket.invulnerableMs = Math.max(0, basket.invulnerableMs - dt * 1000);
  basket.shakeMs = Math.max(0, basket.shakeMs - dt * 1000);
  basket.hopMs = Math.max(0, basket.hopMs - dt * 1000);

  return basket;
}

function basketPose(basket, time) {
  return {
    hop: basket.hopMs > 0 ? Math.sin((1 - basket.hopMs / 220) * Math.PI) * 5 : 0,
    // 同帧角色与桶使用相同的确定性抖动，避免两者错位
    shakeX: basket.shakeMs > 0 ? Math.sin(time * 0.09) * 4 : 0,
    bottom: basket.y + basket.drawH,
  };
}

export function drawCharacter(ctx, basket, images, time) {
  const head = readImage(images, 'catHead');
  const body = readImage(images, 'catBody');
  if (!head && !body) return;

  const { hop, shakeX, bottom } = basketPose(basket, time);
  const W = basket.drawW;
  const feetY = W * 0.51;
  const lag = (basket.targetX - basket.x) / 70;
  const tilt = Math.max(-0.075, Math.min(0.075, lag * 0.06));
  const bob = Math.sin(time * 0.004) * 1.4;

  ctx.save();
  ctx.translate(basket.x + shakeX, bottom - hop);

  // 脚下阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, feetY + 2, W * 0.42, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (basket.invulnerableMs > 0 && Math.floor(time / 80) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  ctx.rotate(tilt);

  if (body) {
    const bodyW = W * 0.807;
    const bodyH = bodyW * (body.naturalHeight / body.naturalWidth);
    // 参考图里腿的视觉中心比图片中心略偏左
    const bodyX = -W * 0.0352;
    ctx.drawImage(body, bodyX - bodyW / 2, feetY - bodyH, bodyW, bodyH);
  }

  if (head) {
    const headW = W * 1.237;
    const headH = headW * (head.naturalHeight / head.naturalWidth);
    const headBottom = -basket.drawH + W * 0.098;
    // 参考图里猫头（眼睛中心）比桶中心略偏右，与双腿中心线对齐
    const headX = W * 0.0611;
    ctx.drawImage(head, headX - headW / 2, headBottom - headH + bob, headW, headH);
  }

  ctx.restore();
}

export function drawBasket(ctx, basket, images, time) {
  const full = basket.catchFlashMs > 0 || basket.hasCandy;
  const image = readImage(images, full ? 'basketFull' : 'basket');
  const { hop, shakeX, bottom } = basketPose(basket, time);
  const W = basket.drawW;

  ctx.save();
  ctx.translate(basket.x + shakeX, bottom - hop);

  if (basket.invulnerableMs > 0 && Math.floor(time / 80) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  if (image) {
    const drawH = full ? W * imageRatio(image) : basket.drawH;
    ctx.drawImage(image, -W / 2, -drawH, W, drawH);
  } else {
    ctx.fillStyle = COLORS.orange;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-W / 2, -basket.drawH, W, basket.drawH, 18);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function createItem(type, images, { x, y, speed, drift = 0 }) {
  const key = ITEM_KEYS[type];
  const image = readImage(images, key);
  const height = CANDY_SIZE[type] || 80;
  const width = image ? height * (image.naturalWidth / image.naturalHeight) : height * 0.8;
  const isBomb = type === 'bomb';
  const isHeart = type === 'heart';

  return {
    type,
    key,
    x,
    y,
    vx: drift,
    vy: speed,
    size: height,
    width,
    height,
    radius: width / 2,
    rotation: isBomb || isHeart ? 0 : ((Math.random() - 0.5) * 24 * Math.PI) / 180,
    spin: isBomb || isHeart ? 0 : (Math.random() - 0.5) * 0.9,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmp: isBomb || isHeart ? 5 + Math.random() * 6 : 7 + Math.random() * 7,
    bornAt: performance.now(),
    color: CANDY_COLOR[type] || COLORS.orange,
  };
}

export function updateItem(item, dt) {
  item.wobblePhase += dt * 1.7;
  item.x += item.vx * dt + Math.cos(item.wobblePhase) * item.wobbleAmp * dt;
  item.y += item.vy * dt;
  item.rotation += item.spin * dt;
  return item;
}

export function drawItem(ctx, item, images, time) {
  const image = readImage(images, item.key);

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation);

  if (item.type === 'bomb') {
    const pulse = 1 + Math.sin(time / 110 + item.wobblePhase) * 0.03;
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.arc(0, 0, item.width * 0.62 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, item.height * 0.46, item.width * 0.32, item.height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  if (image) {
    ctx.drawImage(image, -item.width / 2, -item.height / 2, item.width, item.height);
  } else {
    ctx.fillStyle = item.color;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, item.width * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function hitsBasket(item, basket) {
  const horizontal = Math.abs(item.x - basket.x) <= GAME.catcherHalfWidth + item.radius * 0.4;
  const top = GAME.catcherTop - item.radius * 0.5;
  const bottom = GAME.catcherBottom + item.radius * 0.5;
  return horizontal && item.y >= top && item.y <= bottom;
}
