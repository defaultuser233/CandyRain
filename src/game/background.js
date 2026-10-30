import { COLORS } from './config.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createBackground({ width, height }) {
  const random = mulberry32(20261031);
  const stars = [];
  for (let i = 0; i < 64; i++) {
    stars.push({
      x: random() * width,
      y: random() * height * 0.52,
      r: 0.6 + random() * 1.7,
      baseAlpha: 0.25 + random() * 0.55,
      speed: 0.0006 + random() * 0.0011,
      phase: random() * Math.PI * 2,
    });
  }

  const fireflies = [];
  for (let i = 0; i < 9; i++) {
    fireflies.push({
      x: 60 + random() * (width - 120),
      y: height * 0.58 + random() * height * 0.28,
      phase: random() * Math.PI * 2,
      speed: 0.4 + random() * 0.5,
      amp: 6 + random() * 12,
    });
  }

  const moon = { x: width * 0.79, y: height * 0.17, radius: 58 };
  let staticLayer = null;

  function buildStaticLayer() {
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const ctx = layer.getContext('2d');

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#0d1838');
    sky.addColorStop(0.42, COLORS.nightBlue);
    sky.addColorStop(0.78, '#070b18');
    sky.addColorStop(1, COLORS.night);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const moonGlow = ctx.createRadialGradient(
      moon.x,
      moon.y,
      moon.radius * 0.2,
      moon.x,
      moon.y,
      moon.radius * 4.2,
    );
    moonGlow.addColorStop(0, 'rgba(255, 180, 110, 0.22)');
    moonGlow.addColorStop(0.35, 'rgba(233, 86, 32, 0.1)');
    moonGlow.addColorStop(1, 'rgba(233, 86, 32, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moon.x - moon.radius * 4.2, moon.y - moon.radius * 4.2, moon.radius * 8.4, moon.radius * 8.4);

    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(217, 190, 150, 0.28)';
    for (const crater of [
      [-18, -12, 11],
      [16, 8, 8],
      [4, -24, 6],
      [-8, 22, 5],
    ]) {
      ctx.beginPath();
      ctx.arc(moon.x + crater[0], moon.y + crater[1], crater[2], 0, Math.PI * 2);
      ctx.fill();
    }

    drawHouse(ctx, 62, height * 0.66);
    drawTree(ctx, width * 0.14, height * 0.7);
    drawHills(ctx, height);
    drawGround(ctx, height);
    drawFence(ctx, width, height);
    drawGraves(ctx, width, height);

    staticLayer = layer;
  }

  function drawHouse(ctx, x, baseY) {
    ctx.save();
    ctx.fillStyle = '#04060d';
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, baseY - 96);
    ctx.lineTo(x + 48, baseY - 140);
    ctx.lineTo(x + 104, baseY - 108);
    ctx.lineTo(x + 104, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 74, baseY - 118);
    ctx.lineTo(x + 92, baseY - 178);
    ctx.lineTo(x + 100, baseY - 108);
    ctx.closePath();
    ctx.fillStyle = '#04060d';
    ctx.fill();

    const windows = [
      [x + 18, baseY - 84, 18, 22],
      [x + 56, baseY - 76, 18, 22],
    ];
    for (const [wx, wy, ww, wh] of windows) {
      ctx.fillStyle = 'rgba(255, 138, 61, 0.55)';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy);
      ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTree(ctx, x, baseY) {
    ctx.save();
    ctx.strokeStyle = '#03050a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(x, baseY + 60);
    ctx.lineTo(x + 4, baseY - 92);
    ctx.stroke();

    ctx.lineWidth = 7;
    const branches = [
      [0, -30, -46, -78],
      [2, -22, 52, -58],
      [1, -58, -34, -106],
      [2, -60, 40, -102],
      [4, -88, 12, -132],
    ];
    for (const [sx, sy, ex, ey] of branches) {
      ctx.beginPath();
      ctx.moveTo(x + sx, baseY + sy);
      ctx.lineTo(x + ex, baseY + ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHills(ctx, h) {
    ctx.save();
    ctx.fillStyle = '#040713';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    ctx.bezierCurveTo(width * 0.16, h * 0.62, width * 0.3, h * 0.72, width * 0.46, h * 0.68);
    ctx.bezierCurveTo(width * 0.62, h * 0.63, width * 0.72, h * 0.73, width * 0.86, h * 0.69);
    ctx.bezierCurveTo(width * 0.94, h * 0.67, width, h * 0.71, width, h * 0.71);
    ctx.lineTo(width, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGround(ctx, h) {
    ctx.save();
    const ground = ctx.createLinearGradient(0, h * 0.82, 0, h);
    ground.addColorStop(0, '#04060d');
    ground.addColorStop(1, '#020308');
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.82, width, h * 0.18);

    ctx.strokeStyle = 'rgba(255, 245, 230, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.82);
    ctx.lineTo(width, h * 0.82);
    ctx.stroke();

    ctx.strokeStyle = '#030509';
    ctx.lineWidth = 3;
    for (let i = 0; i < 22; i++) {
      const x = (i / 21) * width;
      const blade = 6 + ((i * 7) % 13);
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + (i % 2 ? 4 : -4), h - blade * 0.6, x + (i % 3 - 1) * 6, h - blade);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFence(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = '#03050a';
    ctx.lineWidth = 4;
    const y = h * 0.79;
    for (let x = 18; x < w; x += 58) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 34);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y - 14);
    ctx.lineTo(w, y - 18);
    ctx.moveTo(0, y - 28);
    ctx.lineTo(w, y - 32);
    ctx.stroke();
    ctx.restore();
  }

  function drawGraves(ctx, w, h) {
    ctx.save();
    const graves = [
      [w * 0.22, 0.775, 34, 50],
      [w * 0.3, 0.79, 26, 38],
      [w * 0.55, 0.785, 30, 44],
      [w * 0.62, 0.8, 22, 32],
      [w * 0.9, 0.775, 32, 46],
    ];
    for (const [x, yRatio, gw, gh] of graves) {
      const y = h * yRatio;
      ctx.fillStyle = '#05070d';
      ctx.beginPath();
      ctx.roundRect(x - gw / 2, y - gh, gw, gh, [gw / 2, gw / 2, 3, 3]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 245, 230, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(ctx, timeMs, { shakeX = 0, shakeY = 0, dim = 0 } = {}) {
    if (!staticLayer) buildStaticLayer();

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.drawImage(staticLayer, 0, 0);

    for (const star of stars) {
      const flicker = Math.sin(timeMs * star.speed + star.phase);
      ctx.fillStyle = `rgba(255, 246, 224, ${Math.max(0.05, star.baseAlpha + flicker * 0.18)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let band = 0; band < 3; band++) {
      const offset = ((timeMs * 0.008 * (band + 1)) % (width + 300)) - 300;
      const y = height * (0.66 + band * 0.06);
      const fog = ctx.createLinearGradient(0, y - 40, 0, y + 40);
      fog.addColorStop(0, 'rgba(180, 200, 255, 0)');
      fog.addColorStop(0.5, `rgba(160, 185, 240, ${0.035 - band * 0.008})`);
      fog.addColorStop(1, 'rgba(180, 200, 255, 0)');
      ctx.fillStyle = fog;
      ctx.beginPath();
      ctx.ellipse(offset + width * 0.35, y, width * 0.42, 34, 0, 0, Math.PI * 2);
      ctx.ellipse(offset + width * 0.95, y + 6, width * 0.36, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const fly of fireflies) {
      const x = fly.x + Math.sin(timeMs * 0.0005 * fly.speed + fly.phase) * fly.amp;
      const y = fly.y + Math.cos(timeMs * 0.0007 * fly.speed + fly.phase) * fly.amp * 0.5;
      const alpha = 0.18 + Math.sin(timeMs * 0.002 + fly.phase) * 0.14;
      if (alpha <= 0) continue;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 7);
      glow.addColorStop(0, `rgba(255, 180, 100, ${alpha + 0.2})`);
      glow.addColorStop(1, 'rgba(255, 140, 60, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(
      width / 2,
      height * 0.46,
      height * 0.24,
      width / 2,
      height * 0.5,
      width * 0.66,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    if (dim > 0) {
      ctx.fillStyle = `rgba(5, 7, 15, ${Math.min(0.92, dim)})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  function destroy() {
    staticLayer = null;
    stars.length = 0;
    fireflies.length = 0;
  }

  return { draw, destroy };
}
