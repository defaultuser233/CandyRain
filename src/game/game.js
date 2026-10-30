import {
  GAME,
  COLORS,
  SCORING,
  DIFFICULTY,
  CANDY_DEFS,
} from './config.js';
import {
  createBasket,
  updateBasket,
  drawCharacter,
  drawBasket,
  createItem,
  updateItem,
  drawItem,
  hitsBasket,
} from './entities.js';
import { createParticles } from './particles.js';
import { createBackground } from './background.js';
import { createInput } from './input.js';

const ITEM_LIMIT = 40;
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pickCandy() {
  const types = Object.keys(CANDY_DEFS);
  const total = types.reduce((sum, type) => sum + CANDY_DEFS[type].weight, 0);
  let roll = Math.random() * total;
  for (const type of types) {
    roll -= CANDY_DEFS[type].weight;
    if (roll <= 0) return type;
  }
  return types[0];
}

export function createGame({ canvas, images, audio, onHud, onGameOver }) {
  const ctx = canvas.getContext('2d');

  let state = 'idle';
  let paused = false;
  let score = 0;
  let lives = GAME.maxLives;
  let combo = 0;
  let multiplier = 1;
  let catchCount = 0;
  let elapsed = 0;

  let items = [];
  let basket = null;
  let particles = createParticles();
  let background = null;
  let input = null;

  let spawnTimer = 0;
  let lastCandyType = null;
  let candyStreak = 0;
  let lastHeartAt = -Infinity;
  let shake = 0;
  let flash = 0;
  let dim = 0;

  let dying = false;
  let deathElapsed = 0;
  let gameOverSent = false;

  let rafId = null;
  let lastFrame = 0;
  let hudTimer = 0;
  let dpr = 1;

  function play(method, ...args) {
    try {
      if (audio && typeof audio[method] === 'function') {
        audio[method](...args);
      }
    } catch (error) {
      // 音频失败不能打断游戏
    }
  }

  function resizeBuffer() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.round(GAME.width * dpr);
    const nextHeight = Math.round(GAME.height * dpr);
    if (canvas.width !== nextWidth) canvas.width = nextWidth;
    if (canvas.height !== nextHeight) canvas.height = nextHeight;
  }

  function handleResize() {
    resizeBuffer();
    draw(performance.now());
  }

  function hudSnapshot() {
    return {
      score,
      lives,
      maxLives: GAME.maxLives,
      combo,
      multiplier,
      catchCount,
      elapsedMs: Math.round(elapsed * 1000),
      fullBasket: Boolean(basket && (basket.catchFlashMs > 0 || basket.hasCandy)),
    };
  }

  function pushHud(force = false) {
    if (!onHud) return;
    if (!force && hudTimer < 0.1) return;
    hudTimer = 0;
    onHud(hudSnapshot());
  }

  function spawnInterval() {
    return (
      Math.max(
        DIFFICULTY.minSpawnMs,
        DIFFICULTY.baseSpawnMs - DIFFICULTY.spawnRampPerSec * elapsed,
      ) / 1000
    );
  }

  function fallSpeed() {
    return Math.min(
      DIFFICULTY.maxSpeed,
      DIFFICULTY.baseSpeed + DIFFICULTY.speedRampPerSec * elapsed,
    );
  }

  function chooseType() {
    const canHeart = lives < GAME.maxLives && performance.now() - lastHeartAt >= DIFFICULTY.heartCooldownMs;
    const bombChance = Math.min(
      DIFFICULTY.bombChanceMax,
      DIFFICULTY.bombChanceStart + DIFFICULTY.bombRampPerSec * elapsed,
    );
    const roll = Math.random();

    if (canHeart && roll < DIFFICULTY.heartChance) return 'heart';
    if (roll < bombChance) return 'bomb';
    return 'candy';
  }

  function pickCandyType() {
    let type = pickCandy();
    if (type === lastCandyType && candyStreak >= 3) {
      const before = type;
      while (type === before) type = pickCandy();
    }
    if (type === lastCandyType) {
      candyStreak += 1;
    } else {
      lastCandyType = type;
      candyStreak = 1;
    }
    return type;
  }

  function spawn() {
    if (items.length >= ITEM_LIMIT) return;

    let type = chooseType();
    if (type === 'candy') type = pickCandyType();

    const x = 70 + Math.random() * (GAME.width - 140);
    items.push(
      createItem(type, images, {
        x,
        y: -90,
        speed: fallSpeed(),
        drift: (Math.random() - 0.5) * 40,
      }),
    );
  }

  function startDeath() {
    if (dying) return;
    dying = true;
    deathElapsed = 0;
    shake = 12;
    if (basket) {
      particles.emitBomb(basket.x, basket.y + basket.drawH * 0.5);
    }
    pushHud(true);
  }

  function finishDeath() {
    if (gameOverSent) return;
    gameOverSent = true;
    state = 'over';
    play('gameOver');
    pushHud(true);
    if (onGameOver) {
      onGameOver({
        score,
        catchCount,
        elapsedMs: Math.round(elapsed * 1000),
      });
    }
  }

  function catchCandy(item) {
    const def = CANDY_DEFS[item.type];
    const previousMultiplier = multiplier;

    combo += 1;
    multiplier = Math.min(
      SCORING.maxMultiplier,
      1 + Math.floor(combo / SCORING.comboStep),
    );
    score += def.points * multiplier;
    catchCount += 1;

    particles.emitCandy(item.x, item.y, def.color);
    particles.emitText(item.x, item.y - 16, `+${def.points * multiplier}`, COLORS.white);
    if (multiplier > previousMultiplier) {
      particles.emitText(item.x, item.y - 46, `×${multiplier} 倍率`, COLORS.orangeBright);
    }

    if (basket) {
      basket.catchFlashMs = 160;
      basket.hopMs = 220;
      basket.hasCandy = true;
    }

    play('catch', combo);
    pushHud(true);
  }

  function hitBomb(item) {
    if (!basket) return;
    particles.emitBomb(item.x, item.y);
    if (basket.invulnerableMs > 0) return;

    lives = Math.max(0, lives - 1);
    combo = 0;
    multiplier = 1;
    basket.invulnerableMs = GAME.invulnerableMs;
    basket.shakeMs = 400;
    shake = 10;
    flash = 1;

    play('bomb');
    pushHud(true);

    if (lives <= 0) startDeath();
  }

  function catchHeart(item) {
    lives = Math.min(GAME.maxLives, lives + 1);
    lastHeartAt = performance.now();
    particles.emitText(item.x, item.y - 18, '+1 生命', COLORS.lime);
    particles.emitCandy(item.x, item.y, COLORS.lime);
    play('heart');
    pushHud(true);
  }

  function handleCollision(item) {
    if (item.type === 'bomb') hitBomb(item);
    else if (item.type === 'heart') catchHeart(item);
    else catchCandy(item);
  }

  function update(dt, time) {
    if (!dying) {
      elapsed += dt;
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawn();
        spawnTimer = spawnInterval();
      }
    } else {
      deathElapsed += dt;
    }

    hudTimer += dt;

    if (basket && !dying) {
      if (input && input.keyboardActive) {
        // 键盘接管后，鼠标不移动就不会抢回控制权
        const dir = input.getKeyboardDirection();
        if (dir !== 0) {
          basket.targetX = clamp(
            basket.targetX + dir * 620 * dt,
            GAME.catcherHalfWidth,
            GAME.width - GAME.catcherHalfWidth,
          );
        }
      } else if (input && input.position != null) {
        // 鼠标悬停即跟随，无需按住
        basket.targetX = clamp(
          input.position,
          GAME.catcherHalfWidth,
          GAME.width - GAME.catcherHalfWidth,
        );
      }
      updateBasket(basket, dt);
    }

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      updateItem(item, dt);

      if (item.y > GAME.height + 80) {
        const isCandy = item.type !== 'bomb' && item.type !== 'heart';
        if (!dying && isCandy && combo > 0) {
          combo = 0;
          multiplier = 1;
          pushHud(true);
        }
        items.splice(i, 1);
        continue;
      }

      if (!dying && basket && hitsBasket(item, basket)) {
        items.splice(i, 1);
        handleCollision(item);
      }
    }

    particles.update(dt);

    shake = Math.max(0, shake - dt * 30);
    flash = Math.max(0, flash - dt * 5.5);

    if (dying) {
      dim = Math.min(1, deathElapsed / (GAME.deathMs / 1000));
      if (deathElapsed * 1000 >= GAME.deathMs) {
        finishDeath();
      }
    }

    if (state === 'running' || state === 'over') {
      pushHud();
    }
  }

  function draw(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, GAME.width, GAME.height);

    const offsetX = !prefersReducedMotion && shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const offsetY = !prefersReducedMotion && shake > 0 ? (Math.random() - 0.5) * shake : 0;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    if (background) background.draw(ctx, time, { dim: 0 });

    if (basket) {
      drawCharacter(ctx, basket, images, time);
    }
    for (const item of items) {
      drawItem(ctx, item, images, time);
    }
    if (basket) {
      drawBasket(ctx, basket, images, time);
    }
    particles.draw(ctx);

    if (flash > 0) {
      ctx.fillStyle = `rgba(214, 40, 40, ${flash * 0.28})`;
      ctx.fillRect(0, 0, GAME.width, GAME.height);
    }
    if (dim > 0) {
      ctx.fillStyle = `rgba(5, 7, 15, ${dim})`;
      ctx.fillRect(0, 0, GAME.width, GAME.height);
    }

    ctx.restore();
  }

  function frame(timestamp) {
    rafId = null;
    if (state !== 'running' && state !== 'over') return;

    if (paused) {
      rafId = requestAnimationFrame(frame);
      return;
    }

    if (!lastFrame) lastFrame = timestamp;
    const dt = Math.min((timestamp - lastFrame) / 1000, 0.05);
    lastFrame = timestamp;

    if (state === 'running') update(dt, timestamp);
    draw(timestamp);

    if (state === 'running') {
      rafId = requestAnimationFrame(frame);
    }
  }

  function startLoop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    lastFrame = 0;
    rafId = requestAnimationFrame(frame);
  }

  function reset() {
    resizeBuffer();

    state = 'running';
    paused = false;
    score = 0;
    lives = GAME.maxLives;
    combo = 0;
    multiplier = 1;
    catchCount = 0;
    elapsed = 0;
    hudTimer = 0;
    items = [];
    spawnTimer = 0.4;
    lastCandyType = null;
    candyStreak = 0;
    lastHeartAt = -Infinity;
    shake = 0;
    flash = 0;
    dim = 0;
    dying = false;
    deathElapsed = 0;
    gameOverSent = false;

    particles.clear();
    basket = createBasket(images);
    basket.targetX = GAME.width / 2;

    if (!background) {
      background = createBackground({ width: GAME.width, height: GAME.height });
    }
    if (!input) {
      input = createInput({ canvas, width: GAME.width, height: GAME.height });
      if (typeof input.onFirstInput === 'function') {
        input.onFirstInput(() => play('unlock'));
      }
    }
    if (typeof input.attach === 'function') input.attach();

    lastFrame = 0;
    pushHud(true);
    startLoop();
  }

  function start() {
    reset();
    play('start');
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (input && typeof input.detach === 'function') input.detach();
    state = 'idle';
    dying = false;
  }

  function onVisibilityChange() {
    paused = document.hidden;
    lastFrame = 0;
    if (!document.hidden && state === 'running' && rafId === null) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function destroy() {
    stop();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('resize', handleResize);
    if (input) {
      if (typeof input.destroy === 'function') input.destroy();
      input = null;
    }
    if (background) {
      background.destroy();
      background = null;
    }
    particles.clear();
    basket = null;
    items = [];
    state = 'idle';
  }

  resizeBuffer();
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('resize', handleResize);

  return {
    start,
    stop,
    destroy,
    get state() {
      if (state === 'running' && paused) return 'paused';
      return state;
    },
    get score() {
      return score;
    },
  };
}
