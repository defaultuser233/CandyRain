import './game-over.css';

/**
 * 游戏结束弹窗 — candy-rain
 *
 * 契约（PRD §6 + §8.2）：
 *  export function createGameOver({ mount, onRestart })
 *  返回 { show, hide, destroy }
 */

export function createGameOver({ mount, onRestart }) {
  /** @type {string | null} */
  let panelRef = null;

  /** @type {string | null} */
  let restartBtnRef = null;

  function _buildDOM() {
    if (mount.firstElementChild) return; // 已注入

    const titleId = 'go-title';
    const panelId = 'go-panel';

    const html = `<div id="${panelId}"
      class="game-over-panel panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${titleId}">
      <h2 id="${titleId}" class="game-over-title">游戏结束</h2>
      <p class="game-over-subtitle">不给糖就捣蛋！</p>
      <div class="game-over-score-block">
        <span class="game-over-score-label">分数</span>
        <span class="game-over-score-val">0</span>
      </div>
      <div class="game-over-best-block">
        <span class="game-over-best-text">最高分</span>
        <span class="game-over-best-val">0</span>
      </div>
      <div class="game-over-new-best" hidden>
        <span class="game-over-new-badge chip" style="background:rgba(233,86,32,.18);border-color:rgba(233,86,32,0.55)">新纪录！</span>
      </div>
      <div class="game-over-stats">接住 0 颗糖果 · 坚持 00:00</div>
      <button class="btn btn--primary" id="go-restart" type="button">再来</button>
    </div>`;

    mount.innerHTML = html;
    mount.classList.add('game-over-layer');

    panelRef = document.getElementById(panelId);
    restartBtnRef = panelRef?.querySelector('#go-restart');

    restartBtnRef?.addEventListener('click', onRestart);
  }

  function _formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  return {
    /**
     * 显示游戏结束弹窗。
     * @param {{ score: number; best: number; isNewBest: boolean; catchCount: number; elapsedMs: number }}
     */
    show({ score = 0, best = 0, isNewBest = false, catchCount = 0, elapsedMs = 0 }) {
      _buildDOM();

      // 更新面板内容
      const panel = panelRef;
      if (!panel) return;

      const scoreVal = panel.querySelector('.game-over-score-val');
      const bestText = panel.querySelector('.game-over-best-text');
      const bestVal = panel.querySelector('.game-over-best-val');
      const newBadgeBlock = panel.querySelector('.game-over-new-best');
      const stats = panel.querySelector('.game-over-stats');
      const title = panel.querySelector('.game-over-title');

      scoreVal.textContent = String(score);
      bestText.textContent = '最高分';
      bestVal.textContent = String(best);

      if (isNewBest) {
        newBadgeBlock.hidden = false;
        title.classList.add('game-over-title--new');
      } else {
        newBadgeBlock.hidden = true;
        title.classList.remove('game-over-title--new');
      }

      stats.textContent = `接住 ${catchCount} 颗糖果 · 坚持 ${_formatTime(elapsedMs)}`;

      // 显隐控制
      mount.classList.remove('game-over-hidden');
      mount.hidden = false;

      // 焦点移到再来按钮
      requestAnimationFrame(() => {
        restartBtnRef?.focus();
      });

      // 重新触发动画（重复 show 可以重新播放）
      panel.style.animation = '';
      panel.style.opacity = '';
      panel.style.transform = '';
      void panel.offsetWidth;
      panel.style.animation = 'gameOverEnter 200ms var(--ease-out) both';
    },

    /** 隐藏弹窗，恢复 hidden。 */
    hide() {
      const panel = panelRef;
      if (panel) {
        panel.style.animation = '';
      }
      mount.hidden = true;
      mount.classList.add('game-over-hidden');
    },

    /** 销毁，清理事件。 */
    destroy() {
      mount.hidden = true;
      mount.innerHTML = '';
      panelRef = null;
      restartBtnRef = null;
    },
  };
}