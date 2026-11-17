// Общие помощники: перетаскивание и изменение размера объектов (мышь + палец).
// Учитывают масштаб доски, поэтому объект всегда движется вместе с курсором.
const DragUtil = (() => {
  const point = (e) => (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;

  function draggable(el, opts = {}) {
    const { ignore = '', threshold = 3, canStart, onDragStart, preventMouseDefault = false } = opts;
    let down = false, dragging = false;
    let sx = 0, sy = 0, left0 = 0, top0 = 0, scale = 1;

    function start(e) {
      if (e.type === 'mousedown' && e.button !== 0) return;
      if (e.touches && e.touches.length > 1) return; // два пальца — это жест масштаба доски
      if (ignore && e.target.closest(ignore)) return;
      if (CanvasModule.getTool() === 'hand') return;
      if (!Permissions.can('edit')) return;
      if (typeof ReactionsModule !== 'undefined' && ReactionsModule.getReaction()) return;
      if (canStart && !canStart(e)) return;

      const p = point(e);
      down = true; dragging = false;
      sx = p.clientX; sy = p.clientY;
      left0 = el.offsetLeft; top0 = el.offsetTop;
      scale = CanvasModule.getScale();
      e.stopPropagation();
      if (preventMouseDefault && e.type === 'mousedown') e.preventDefault();

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', end);
      document.addEventListener('touchmove', move, { passive: false });
      document.addEventListener('touchend', end);
      document.addEventListener('touchcancel', end);
    }

    function move(e) {
      if (!down) return;
      if (e.touches && e.touches.length > 1) { end(); return; }
      const p = point(e);
      const dx = p.clientX - sx, dy = p.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) > threshold) {
        dragging = true;
        if (onDragStart) onDragStart();
        document.body.style.userSelect = 'none';
      }
      if (dragging) {
        el.style.left = (left0 + dx / scale) + 'px';
        el.style.top = (top0 + dy / scale) + 'px';
        if (e.cancelable && e.type === 'touchmove') e.preventDefault();
      }
    }

    function end() {
      down = false; dragging = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', end);
    }

    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: true });
  }

  function resizable(handle, el, opts = {}) {
    const { keepRatio = false } = opts;
    const getMinW = () => (typeof opts.minW === 'function' ? opts.minW() : (opts.minW || 100));
    const getMinH = () => (typeof opts.minH === 'function' ? opts.minH() : (opts.minH || 80));
    let on = false, sx = 0, sy = 0, w0 = 0, h0 = 0, ratio = 1, scale = 1;

    function start(e) {
      if (e.type === 'mousedown' && e.button !== 0) return;
      if (!Permissions.can('edit')) return;
      if (e.touches && e.touches.length > 1) return;
      const p = point(e);
      on = true;
      sx = p.clientX; sy = p.clientY;
      w0 = el.offsetWidth; h0 = el.offsetHeight;
      ratio = w0 / h0;
      scale = CanvasModule.getScale();
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', end);
      document.addEventListener('touchmove', move, { passive: false });
      document.addEventListener('touchend', end);
      document.addEventListener('touchcancel', end);
    }

    function move(e) {
      if (!on) return;
      if (e.touches && e.touches.length > 1) { end(); return; }
      const p = point(e);
      const w = Math.max(getMinW(), w0 + (p.clientX - sx) / scale);
      el.style.width = w + 'px';
      el.style.height = (keepRatio ? w / ratio : Math.max(getMinH(), h0 + (p.clientY - sy) / scale)) + 'px';
      if (e.cancelable && e.type === 'touchmove') e.preventDefault();
    }

    function end() {
      on = false;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', end);
    }

    handle.addEventListener('mousedown', start);
    handle.addEventListener('touchstart', start, { passive: false });
  }

  return { draggable, resizable };
})();
