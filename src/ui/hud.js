import './hud.css';

const UNMUTED_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M8 15h6l8-7v24l-8-7H8z" fill="currentColor"/>
  <path d="M27 14c3 3 3 9 0 12M30 10c6 5 6 15 0 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const MUTED_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M8 15h6l8-7v24l-8-7H8z" fill="currentColor"/>
  <path d="M26 16l9 9M35 16l-9 9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const HEART_SVG = `<svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M26 48c-12.5-9.7-21-24-21-40a5 5 0 0 1 9.2-2.8l3.8 6.6 8.5-8.5a4 4 0 0 1 5.6 0l8.5 8.5 3.8-6.6a5 5 0 0 1 9.2 2.8c0 16-8.5 30.3-21 40z" fill="currentColor"/>
</svg>`;

const MARKUP = `
  <div class="hud__top">
    <div class="hud__left">
      <div class="hud__score-card">
        <img class="hud__score-icon" alt="" />
        <div class="hud__score-text">
          <span class="hud__score-label">分数</span>
          <span class="hud__score-value">0</span>
        </div>
      </div>
      <div class="hud__char-card">
        <img class="hud__char-avatar" alt="小南瓜狐头像" />
        <div class="hud__char-info">
          <span class="hud__char-name">小南瓜狐</span>
          <span class="hud__char-title">糖果猎人</span>
        </div>
      </div>
      <div class="hud__combo">连击 2</div>
    </div>
    <div class="hud__right">
      <div class="hud__lives" aria-label="剩余生命"></div>
      <div class="hud__meta">
        <div class="hud__best"><span class="hud__best-text">最高</span><span class="hud__best-value">0</span></div>
        <button class="hud__mute-btn" type="button" aria-label="声音已开启，点击静音">${UNMUTED_SVG}</button>
      </div>
    </div>
  </div>
  <div class="hud__hint hud__hint--hidden">移动鼠标控制篮子</div>
  <div class="hud__aria-live" aria-live="polite"></div>
`;

export function createHud({ mount, images, muted = false, onToggleMute }) {
  mount.innerHTML = MARKUP;

  const scoreIcon = mount.querySelector('.hud__score-icon');
  const scoreValue = mount.querySelector('.hud__score-value');
  const avatar = mount.querySelector('.hud__char-avatar');
  const combo = mount.querySelector('.hud__combo');
  const livesBox = mount.querySelector('.hud__lives');
  const bestValue = mount.querySelector('.hud__best-value');
  const muteButton = mount.querySelector('.hud__mute-btn');
  const hint = mount.querySelector('.hud__hint');
  const ariaLive = mount.querySelector('.hud__aria-live');
  const coarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
  if (coarsePointer) hint.textContent = '手指移动篮子';

  const heartNodes = [];
  for (let i = 0; i < 3; i += 1) {
    const heart = document.createElement('img');
    heart.className = 'hud__heart';
    heart.alt = '';
    const source = images && typeof images.get === 'function' ? images.get('heart') : null;
    if (source) heart.src = source.src;
    else heart.innerHTML = HEART_SVG;
    livesBox.appendChild(heart);
    heartNodes.push(heart);
  }

  const scoreSource = images && typeof images.get === 'function' ? images.get('candyPumpkin') : null;
  if (scoreSource) scoreIcon.src = scoreSource.src;
  scoreIcon.alt = '';

  const headSource = images && typeof images.get === 'function' ? images.get('catHead') : null;
  if (headSource) avatar.src = headSource.src;

  let isMuted = Boolean(muted);
  let prevScore = 0;
  let prevLives = 3;
  let prevCombo = 0;
  let prevMultiplier = 1;
  let lastAnnounce = 0;
  let comboTimer = null;
  let livesTimer = null;
  let scoreTimer = null;

  function renderMute() {
    muteButton.innerHTML = isMuted ? MUTED_SVG : UNMUTED_SVG;
    muteButton.setAttribute(
      'aria-label',
      isMuted ? '声音已关闭，点击开启' : '声音已开启，点击静音',
    );
  }
  renderMute();

  function handleMuteClick() {
    isMuted = !isMuted;
    renderMute();
    if (typeof onToggleMute === 'function') onToggleMute(isMuted);
  }
  muteButton.addEventListener('click', handleMuteClick);

  function renderScore(score) {
    if (score === prevScore) return;
    prevScore = score;
    scoreValue.textContent = String(score);
    scoreValue.classList.remove('bounce');
    void scoreValue.offsetWidth;
    scoreValue.classList.add('bounce');
    clearTimeout(scoreTimer);
    scoreTimer = setTimeout(() => scoreValue.classList.remove('bounce'), 220);
  }

  function renderLives(lives, maxLives) {
    const safeLives = Math.max(0, Math.min(maxLives, Math.round(lives)));
    heartNodes.forEach((heart, index) => {
      heart.classList.toggle('lost', index >= safeLives);
    });
    if (safeLives < prevLives) {
      livesBox.classList.remove('shake');
      void livesBox.offsetWidth;
      livesBox.classList.add('shake');
      clearTimeout(livesTimer);
      livesTimer = setTimeout(() => livesBox.classList.remove('shake'), 420);
    }
    prevLives = safeLives;
  }

  function renderCombo(comboCount, multiplier) {
    const count = Math.max(0, Math.round(comboCount));
    const m = Math.max(1, Math.round(multiplier));

    if (count >= 2) {
      combo.textContent = m > 1 ? `连击 ${count} · ×${m}` : `连击 ${count}`;
      combo.classList.add('hud__combo--visible');
      if (count > prevCombo || m > prevMultiplier) {
        combo.classList.remove('pop');
        void combo.offsetWidth;
        combo.classList.add('pop');
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => combo.classList.remove('pop'), 240);
      }
    } else {
      combo.classList.remove('hud__combo--visible');
    }
    prevCombo = count;
    prevMultiplier = m;
  }

  function renderHint(catchCount, elapsedMs) {
    const visible = catchCount === 0 && elapsedMs < 3000;
    hint.classList.toggle('hud__hint--visible', visible);
    hint.classList.toggle('hud__hint--hidden', !visible);
  }

  return {
    update(snapshot = {}) {
      const {
        score = 0,
        lives = 3,
        maxLives = 3,
        combo = 0,
        multiplier = 1,
        catchCount = 0,
        elapsedMs = 0,
      } = snapshot;

      renderScore(Math.round(Math.max(0, score)));
      renderLives(lives, maxLives);
      renderCombo(combo, multiplier);
      renderHint(catchCount, elapsedMs);

      const now = performance.now();
      if (now - lastAnnounce > 5000) {
        lastAnnounce = now;
        ariaLive.textContent = `分数 ${Math.round(score)}，剩余生命 ${Math.round(lives)}`;
      }
    },

    reset() {
      prevScore = 0;
      prevLives = 3;
      prevCombo = 0;
      prevMultiplier = 1;
      scoreValue.textContent = '0';
      scoreValue.classList.remove('bounce');
      heartNodes.forEach((heart) => heart.classList.remove('lost'));
      combo.classList.remove('hud__combo--visible', 'pop');
      combo.textContent = '连击 2';
      hint.classList.remove('hud__hint--visible');
      hint.classList.add('hud__hint--hidden');
      livesBox.classList.remove('shake');
      ariaLive.textContent = '';
      clearTimeout(comboTimer);
      clearTimeout(livesTimer);
      clearTimeout(scoreTimer);
    },

    setBest(best) {
      bestValue.textContent = String(Math.max(0, Math.round(Number(best) || 0)));
    },

    show() {
      mount.style.display = '';
    },

    hide() {
      mount.style.display = 'none';
    },

    setMuted(value) {
      isMuted = Boolean(value);
      renderMute();
    },

    destroy() {
      clearTimeout(comboTimer);
      clearTimeout(livesTimer);
      clearTimeout(scoreTimer);
      muteButton.removeEventListener('click', handleMuteClick);
      mount.innerHTML = '';
    },
  };
}
