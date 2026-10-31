import './start-screen.css';

const BAT_SVG = `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 27C53 12 37 5 22 12 9 18 4 33 12 43c8 10 24 6 32-6 4-6 10-8 16-8s12 2 16 8c8 12 24 16 32 6 8-10 3-25-10-31C83 5 67 12 60 27Z" fill="#0B0710" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
  <path d="M51 17 48 4l12 7 12-7-3 13" fill="#0B0710" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="51" cy="27" r="4.2" fill="#E95620"/>
  <circle cx="69" cy="27" r="4.2" fill="#E95620"/>
  <path d="M55 37l5 5 5-5" fill="none" stroke="#FFF5E6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M56 40v3M64 40v3" stroke="#FFF5E6" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const PUMPKIN_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 14c0-6 3-9 7-9 0 4-2 7-5 9" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="32" cy="38" rx="26" ry="22" fill="#E95620" stroke="#000" stroke-width="3.4"/>
  <path d="M20 19c-6 5-8 13-7 21M44 19c6 5 8 13 7 21" fill="none" stroke="#B93B10" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M18 33l7 5-7 5zM46 33l-7 5 7 5z" fill="#000"/>
  <path d="M23 46c2 4 5 6 9 6s7-2 9-6c-3 1-6 1-9 1s-6 0-9-1z" fill="#000"/>
  <path d="M27 48l1 4 2-3M37 48l-1 4-2-3" fill="#FFF5E6"/>
</svg>`;

function createStartScreen({ mount, images, onStart }) {
  mount.innerHTML = '';

  const background = document.createElement('div');
  background.className = 'start-screen';

  const silhouette = document.createElement('div');
  silhouette.className = 'start-screen__silhouette';
  background.appendChild(silhouette);

  const wrapper = document.createElement('div');
  wrapper.className = 'start-screen__wrapper';

  const decorations = document.createElement('div');
  decorations.className = 'start-screen__decorations';

  // Bats
  const bat1 = document.createElement('svg');
  bat1.className = 'start-screen__bat bat-1';
  bat1.setAttribute('aria-hidden', 'true');
  bat1.innerHTML = BAT_SVG;
  decorations.appendChild(bat1);

  const bat2 = document.createElement('svg');
  bat2.className = 'start-screen__bat bat-2';
  bat2.setAttribute('aria-hidden', 'true');
  bat2.innerHTML = BAT_SVG;
  decorations.appendChild(bat2);

  const bat3 = document.createElement('svg');
  bat3.className = 'start-screen__bat bat-3';
  bat3.setAttribute('aria-hidden', 'true');
  bat3.innerHTML = BAT_SVG;
  bat3.style.transform = 'scaleX(-1)';
  decorations.appendChild(bat3);

  const bat4 = document.createElement('svg');
  bat4.className = 'start-screen__bat bat-4';
  bat4.setAttribute('aria-hidden', 'true');
  bat4.innerHTML = BAT_SVG;
  bat4.style.transform = 'scaleX(-1)';
  decorations.appendChild(bat4);

  const bat5 = document.createElement('svg');
  bat5.className = 'start-screen__bat bat-5';
  bat5.setAttribute('aria-hidden', 'true');
  bat5.innerHTML = BAT_SVG;
  decorations.appendChild(bat5);

  // Pumpkins
  const pumpkin1 = document.createElement('svg');
  pumpkin1.className = 'start-screen__pumpkin pumpkin-1';
  pumpkin1.setAttribute('aria-hidden', 'true');
  pumpkin1.innerHTML = PUMPKIN_SVG;
  decorations.appendChild(pumpkin1);

  const pumpkin2 = document.createElement('svg');
  pumpkin2.className = 'start-screen__pumpkin pumpkin-2';
  pumpkin2.setAttribute('aria-hidden', 'true');
  pumpkin2.innerHTML = PUMPKIN_SVG;
  decorations.appendChild(pumpkin2);

  const pumpkin3 = document.createElement('svg');
  pumpkin3.className = 'start-screen__pumpkin pumpkin-3';
  pumpkin3.setAttribute('aria-hidden', 'true');
  pumpkin3.innerHTML = PUMPKIN_SVG;
  decorations.appendChild(pumpkin3);

  // Floating candies from images
  const candyKeys = ['candyPumpkin', 'candyGhost', 'candyPurple', 'candySkull'];
  candyKeys.forEach((key, i) => {
    const img = images.get(key);
    if (img) {
      const candy = document.createElement('img');
      candy.className = `start-screen__candy candy-${i + 1}`;
      candy.src = img.src;
      candy.alt = '';
      candy.setAttribute('aria-hidden', 'true');
      decorations.appendChild(candy);
    }
  });

  wrapper.appendChild(decorations);

  // Markup
  const markup = document.createElement('div');
  markup.className = 'start-screen__markup';
  markup.innerHTML = `
    <h1 class="start-screen__title">万圣夜糖果雨</h1>
    <p class="start-screen__rules">左右移动篮子接住更多糖果，避开炸弹</p>
    <p class="start-screen__subtext">移动鼠标或手指控制篮子 · 漏接不扣分</p>
    <div class="start-screen__actions">
      <button class="btn btn--primary btn--lg" id="start-btn" type="button">开始游戏</button>
      <div class="start-screen__error"></div>
    </div>
  `;
  wrapper.appendChild(markup);

  const footer = document.createElement('div');
  footer.className = 'start-screen__footer';
  footer.innerHTML = '<span class="start-screen__footer-text">2026 万圣夜 · 不给糖就捣蛋</span>';
  background.appendChild(footer);

  mount.appendChild(background);
  mount.appendChild(wrapper);

  const startBtn = markup.querySelector('#start-btn');
  const errorSlot = markup.querySelector('.start-screen__error');

  startBtn.addEventListener('click', () => {
    onStart();
  });

  return {
    setProgress(ratio) {
      startBtn.textContent = `加载中 ${Math.round(ratio * 100)}%`;
      startBtn.disabled = true;
    },
    setReady(ready) {
      if (ready) {
        startBtn.textContent = '开始游戏';
        startBtn.disabled = false;
      }
    },
    setError(message) {
      errorSlot.textContent = message;
      errorSlot.classList.add('has-error');
      startBtn.disabled = true;
    },
    show() {
      background.style.display = '';
      wrapper.style.display = '';
      wrapper.style.opacity = '1';
    },
    hide() {
      background.style.display = 'none';
      wrapper.style.display = 'none';
      wrapper.style.opacity = '0';
    },
    destroy() {
      mount.innerHTML = '';
    }
  };
}

export { createStartScreen };