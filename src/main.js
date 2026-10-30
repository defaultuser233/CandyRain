import { loadAssets } from './game/assets.js';
import { createAudio } from './game/audio.js';
import { createGame } from './game/game.js';
import { createStartScreen } from './ui/startScreen.js';
import { createHud } from './ui/hud.js';
import { createGameOver } from './ui/gameOver.js';

const BEST_KEY = 'candy-rain:best';


const startMount = document.querySelector('#start-screen');
const gameScreen = document.querySelector('#game-screen');
const hudMount = document.querySelector('#hud');
const gameOverMount = document.querySelector('#game-over-layer');
const canvas = document.querySelector('#game-canvas');

let images = null;
let audio = null;
let startScreen = null;
let hud = null;
let gameOver = null;
let game = null;
let best = readBest();
let ready = false;

function readBest() {
  try {
    const value = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (error) {
    return 0;
  }
}

function writeBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch (error) {
    // 隐私模式下 localStorage 可能不可用
  }
}

function showBootMessage(text) {
  startMount.innerHTML = `<div class="boot-loading"><span class="boot-loading__pumpkin"></span><p>${text}</p></div>`;
}

function handleStart() {
  if (!ready || !game) return;

  audio.unlock();
  audio.click();

  startMount.hidden = true;
  startScreen.hide();
  gameScreen.hidden = false;

  hud.reset();
  hud.setBest(best);
  hud.show();

  game.start();
}

function handleGameOver(result) {
  const isNewBest = result.score > best;
  if (isNewBest) {
    best = result.score;
    writeBest(best);
  }

  hud.setBest(best);
  gameOver.show({
    score: result.score,
    best,
    isNewBest,
    catchCount: result.catchCount,
    elapsedMs: result.elapsedMs,
  });
}

function handleRestart() {
  gameOver.hide();
  audio.unlock();
  audio.click();

  hud.reset();
  hud.setBest(best);
  hud.show();

  game.start();
}

async function boot() {
  showBootMessage('正在点亮南瓜灯…');

  try {
    images = await loadAssets({
      onProgress(loaded, total) {
        showBootMessage(`正在点亮南瓜灯… ${Math.round((loaded / total) * 100)}%`);
      },
    });
  } catch (error) {
    console.error('[candy-rain] 素材加载失败', error);
    startScreen = createStartScreen({ mount: startMount, images: new Map(), onStart: handleStart });
    startScreen.setError('素材加载失败，请刷新页面重试');
    return;
  }

  audio = createAudio();
  hud = createHud({
    mount: hudMount,
    images,
    muted: false,
    onToggleMute(muted) {
      audio.setMuted(muted);
      if (!muted) audio.click();
    },
  });
  gameOver = createGameOver({ mount: gameOverMount, onRestart: handleRestart });
  game = createGame({
    canvas,
    images,
    audio,
    onHud(snapshot) {
      hud.update(snapshot);
    },
    onGameOver: handleGameOver,
  });

  startScreen = createStartScreen({ mount: startMount, images, onStart: handleStart });
  startScreen.setReady(true);
  hud.setBest(best);
  hud.hide();
  ready = true;
}

boot();
