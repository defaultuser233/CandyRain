/**
 * 纯合成音效管理器，不使用任何音频文件。
 * 全部使用 Web Audio API 振荡器 + 噪声 + 增益包络合成。
 * 音量峰值 ≤ 0.18。
 */

let audioCtx = null;
let contextCreated = false;
let muted = false;
let singleTONoiseBuffer = null;

function getCtx() {
  if (audioCtx !== null && !muted) return audioCtx;
  if (muted || contextCreated) return null;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    contextCreated = true;
    // 预生成噪声缓冲（一次性）
    const rate = audioCtx.sampleRate;
    const len = rate * 0.2;
    singleTONoiseBuffer = audioCtx.createBuffer(1, len, rate);
    const data = singleTONoiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } catch (_e) {
    audioCtx = null;
    contextCreated = true;
    return null;
  }
}

function ensureResume() {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/** @param {number} freq */
function playTone(freq, duration = 0.12, type = 'sine', volume = 0.15) {
  const ctx = getCtx();
  if (!ctx) return;
  if (volume > 0.18) volume = 0.18;

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + duration);
}

/**
 * 播放接住音效：短促上行音，音高随 combo 升高（上限 +240Hz）。
 * @param {number} combo 连击数
 */
function playCatch(combo = 0) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const baseFreq = 523.25; // C5
  const rise = Math.min(combo, 8) * 30; // 每连 30Hz，上限 240Hz
  const freq = baseFreq + rise;
  const t0 = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t0 + 0.08);

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.15, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + 0.12);
}

/**
 * 播放炸弹音效：低频噪声 + 频率下滑。
 */
function playBomb() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  // 噪声
  const noise = ctx.createBufferSource();
  noise.buffer = singleTONoiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(ctx.currentTime);

  // 低频下滑
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.32);
  oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

/**
 * 播放爱心音效：明亮双音。
 */
function playHeart() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;

  const notes = [1046.50, 1318.51]; // C6 + E6
  notes.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.1, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.18);
  });
}

function playStart() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;

  // 上行三音：C5 → E5 → G5
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0 + i * 0.08);
    gain.gain.setValueAtTime(0, t0 + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.12, t0 + i * 0.08 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.08 + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0 + i * 0.08);
    osc.stop(t0 + i * 0.08 + 0.15);
  });
}

function playGameOver() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;

  // 下行三音：E4 → C4 → A3
  const notes = [329.63, 261.63, 220.00];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0 + i * 0.12);
    gain.gain.setValueAtTime(0, t0 + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.12, t0 + i * 0.12 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.12 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0 + i * 0.12);
    osc.stop(t0 + i * 0.12 + 0.25);
  });
}

function playClick() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.06, t0 + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.035);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + 0.04);
}

function unlock() {
  ensureResume();
}

function setMuted(v) {
  muted = Boolean(v);
}

/** @typedef {{ get muted(): boolean, setMuted(v: boolean): void, unlock(): void, click(): void, start(): void, catch(combo: number): void, bomb(): void, heart(): void, gameOver(): void }} AudioAPI */

/** @returns {AudioAPI} */
export function createAudio() {
  return {
    get muted() { return muted; },
    setMuted,
    unlock,
    click: playClick,
    start: playStart,
    catch: playCatch,
    bomb: playBomb,
    heart: playHeart,
    gameOver: playGameOver,
  };
}