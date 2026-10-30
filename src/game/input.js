export function createInput({ canvas, width, height }) {
  let position = null;
  let attached = false;
  let active = false;
  let activePointerId = null;
  let controlMode = 'pointer';
  let firstInputFired = false;
  const firstInputCallbacks = [];
  const keys = new Set();

  function isTextTarget(target) {
    if (!target || !target.tagName) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
  }

  function toLogicalX(clientX) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return width / 2;
    return ((clientX - rect.left) / rect.width) * width;
  }

  function fireFirstInput() {
    if (firstInputFired) return;
    firstInputFired = true;
    for (const callback of firstInputCallbacks) {
      try {
        callback();
      } catch (error) {
        // 回调失败不影响输入
      }
    }
    firstInputCallbacks.length = 0;
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0 && event.pointerType === 'mouse') return;
    active = true;
    activePointerId = event.pointerId;
    controlMode = 'pointer';
    position = toLogicalX(event.clientX);
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (error) {
      // 某些浏览器在合成事件下会拒绝捕获
    }
    fireFirstInput();
    event.preventDefault();
  }

  function onPointerMove(event) {
    const isTouch = event.pointerType === 'touch';
    if (isTouch && !active) return;
    if (activePointerId !== null && event.pointerId !== activePointerId && isTouch) return;

    controlMode = 'pointer';
    position = toLogicalX(event.clientX);
    if (isTouch) event.preventDefault();
  }

  function onPointerUp(event) {
    if (!active) return;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    active = false;
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      // 指针捕获可能已自动释放
    }
    activePointerId = null;
  }

  function onKeyDown(event) {
    const key = event.key;
    const moveKey =
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'a' || key === 'A' ||
      key === 'd' || key === 'D';
    if (moveKey && !isTextTarget(document.activeElement)) {
      event.preventDefault();
      controlMode = 'keyboard';
    }
    keys.add(key);
  }

  function onKeyUp(event) {
    keys.delete(event.key);
  }

  function getKeyboardDirection() {
    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    if (left && right) return 0;
    if (left) return -1;
    if (right) return 1;
    return 0;
  }

  function attach() {
    if (attached) return;
    attached = true;
    canvas.addEventListener('pointerdown', onPointerDown, { capture: true, passive: false });
    canvas.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
    canvas.addEventListener('pointerup', onPointerUp, { capture: true, passive: false });
    canvas.addEventListener('pointercancel', onPointerUp, { capture: true, passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: false });
  }

  function detach() {
    if (!attached) return;
    attached = false;
    active = false;
    activePointerId = null;
    position = null;
    controlMode = 'pointer';
    keys.clear();
    canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
    canvas.removeEventListener('pointermove', onPointerMove, { capture: true });
    canvas.removeEventListener('pointerup', onPointerUp, { capture: true });
    canvas.removeEventListener('pointercancel', onPointerUp, { capture: true });
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  function destroy() {
    detach();
    firstInputCallbacks.length = 0;
  }

  function onFirstInput(callback) {
    if (typeof callback !== 'function') return;
    if (firstInputFired) {
      callback();
      return;
    }
    firstInputCallbacks.push(callback);
  }

  return {
    get position() {
      return position;
    },
    get keyboardActive() {
      return controlMode === 'keyboard';
    },
    attach,
    detach,
    destroy,
    onFirstInput,
    getKeyboardDirection,
  };
}
