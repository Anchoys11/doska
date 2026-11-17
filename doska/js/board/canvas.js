const CanvasModule = (() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const wrapper = document.getElementById('canvasWrapper');
  const objectsLayer = document.getElementById('canvasObjects');

  // Отдельный слой для линий: ластик стирает только рисунок, а не сетку
  const strokeCanvas = document.createElement('canvas');
  const sctx = strokeCanvas.getContext('2d');

  let isDrawing = false;
  let currentTool = null;
  let currentColor = '#7c5cff';
  let currentSize = 1;
  let strokes = [];
  let currentStroke = null;

  // Камера
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;

  const OBJECT_SEL = '.sticker, .board-image, .board-file';

  // === КАСТОМНЫЙ КУРСОР ===
  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);

  function updateCursor(e) {
    const drawing = currentTool === 'pen' || currentTool === 'eraser';
    const overBoard = e && e.target && e.target.closest &&
      e.target.closest('#canvasWrapper') && !e.target.closest(OBJECT_SEL);
    if (!drawing || !overBoard) { customCursor.style.display = 'none'; return; }

    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
    customCursor.style.display = 'block';
    const size = Math.max((currentTool === 'eraser' ? currentSize * 8 : currentSize * 2) * scale, 8);
    customCursor.style.width = size + 'px';
    customCursor.style.height = size + 'px';
    customCursor.classList.toggle('eraser', currentTool === 'eraser');
    customCursor.style.backgroundColor = currentTool === 'eraser' ? '' : currentColor;
  }
  window.addEventListener('mousemove', updateCursor);
  document.addEventListener('mouseleave', () => { customCursor.style.display = 'none'; });

  // === ОТРИСОВКА ===
  function syncSize() {
    const dpr = window.devicePixelRatio || 1;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    const pw = Math.max(1, Math.round(w * dpr));
    const ph = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw; canvas.height = ph;
      strokeCanvas.width = pw; strokeCanvas.height = ph;
    }
    return { w, h, dpr };
  }

  function drawGrid(w, h) {
    const dotColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e2e4ec';
    let gap = 40 * scale;
    while (gap < 16) gap *= 2; // при сильном отдалении сетка разрежается
    let startX = offsetX % gap; if (startX > 0) startX -= gap;
    let startY = offsetY % gap; if (startY > 0) startY -= gap;
    const r = Math.max(1.5 * scale, 1);

    ctx.fillStyle = dotColor;
    ctx.beginPath();
    for (let x = startX; x < w; x += gap) {
      for (let y = startY; y < h; y += gap) {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  function redrawCanvas() {
    const { w, h, dpr } = syncSize();

    // сетка
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawGrid(w, h);

    // линии на отдельном слое
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height);
    sctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
    sctx.lineCap = 'round';
    sctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      sctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
      sctx.strokeStyle = stroke.isEraser ? '#000' : stroke.color;
      sctx.lineWidth = stroke.size;
      sctx.beginPath();
      stroke.points.forEach((p, i) => {
        if (i === 0) sctx.moveTo(p.x, p.y); else sctx.lineTo(p.x, p.y);
      });
      if (stroke.points.length === 1) { // одиночный клик — точка
        const p = stroke.points[0];
        sctx.lineTo(p.x + 0.01, p.y);
      }
      sctx.stroke();
    });
    sctx.globalCompositeOperation = 'source-over';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(strokeCanvas, 0, 0);
  }

  let rafPending = false;
  function requestRedraw() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; redrawCanvas(); });
  }

  function updateTransform() {
    objectsLayer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    requestRedraw();
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetX) / scale,
      y: (e.clientY - rect.top - offsetY) / scale
    };
  }

  function getViewportCenter() {
    return {
      x: (wrapper.clientWidth / 2 - offsetX) / scale,
      y: (wrapper.clientHeight / 2 - offsetY) / scale
    };
  }

  // === ЗУМ ===
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const newScale = Math.min(Math.max(0.1, scale * Math.exp(-e.deltaY * 0.001)), 3);
    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
    offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
    scale = newScale;
    updateTransform();
  }, { passive: false });

  // === ОБЩАЯ ЛОГИКА НАЖАТИЯ (мышь и палец) ===
  function pointerStart(point, e, isTouch) {
    // на телефоне пустую доску можно двигать одним пальцем, даже если инструмент не выбран
    if (isTouch && currentTool === null && !(e.target.closest && e.target.closest(OBJECT_SEL)) &&
        !(typeof ReactionsModule !== 'undefined' && ReactionsModule.getReaction())) {
      isPanning = true;
      startPanX = point.clientX - offsetX;
      startPanY = point.clientY - offsetY;
      return true;
    }
    if (currentTool === 'hand') {
      isPanning = true;
      startPanX = point.clientX - offsetX;
      startPanY = point.clientY - offsetY;
      return true;
    }
    if (currentTool === 'pen' || currentTool === 'eraser') {
      if (typeof Permissions !== 'undefined' && !Permissions.can('edit')) return false;
      if (e.target.closest && e.target.closest(OBJECT_SEL)) return false; // не рисуем поверх объектов
      isDrawing = true;
      currentStroke = {
        color: currentColor,
        size: currentTool === 'eraser' ? currentSize * 8 : currentSize * 2,
        points: [getMousePos(point)],
        isEraser: currentTool === 'eraser'
      };
      strokes.push(currentStroke);
      requestRedraw();
      return true;
    }
    return false;
  }

  function pointerMove(point) {
    if (isPanning) {
      offsetX = point.clientX - startPanX;
      offsetY = point.clientY - startPanY;
      updateTransform();
      return true;
    }
    if (isDrawing && currentStroke) {
      currentStroke.points.push(getMousePos(point));
      requestRedraw();
      return true;
    }
    return false;
  }

  function pointerEnd() {
    if (isPanning) {
      isPanning = false;
      if (currentTool === 'hand') wrapper.style.cursor = 'grab';
    }
    isDrawing = false;
    currentStroke = null;
  }

  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (pointerStart(e, e) && currentTool === 'hand') wrapper.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerEnd);

  // === ЖЕСТЫ ДВУМЯ ПАЛЬЦАМИ: щипок — масштаб, перетаскивание — движение доски ===
  let pinch = null;
  const touchDist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  function startPinch(e) {
    // отменяем начатый штрих, чтобы второй палец не оставлял случайных линий
    if (isDrawing && currentStroke) {
      const i = strokes.indexOf(currentStroke);
      if (i !== -1) strokes.splice(i, 1);
      requestRedraw();
    }
    isDrawing = false; currentStroke = null; isPanning = false;
    const a = e.touches[0], b = e.touches[1];
    const rect = wrapper.getBoundingClientRect();
    pinch = {
      d: touchDist(a, b) || 1, scale, offsetX, offsetY,
      cx: (a.clientX + b.clientX) / 2 - rect.left,
      cy: (a.clientY + b.clientY) / 2 - rect.top
    };
  }

  function movePinch(e) {
    const a = e.touches[0], b = e.touches[1];
    const rect = wrapper.getBoundingClientRect();
    const cx = (a.clientX + b.clientX) / 2 - rect.left;
    const cy = (a.clientY + b.clientY) / 2 - rect.top;
    const newScale = Math.min(Math.max(0.1, pinch.scale * (touchDist(a, b) / pinch.d)), 3);
    // точка доски под пальцами остаётся под пальцами
    const wx = (pinch.cx - pinch.offsetX) / pinch.scale;
    const wy = (pinch.cy - pinch.offsetY) / pinch.scale;
    scale = newScale;
    offsetX = cx - wx * newScale;
    offsetY = cy - wy * newScale;
    updateTransform();
  }

  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length >= 2) { startPinch(e); e.preventDefault(); return; }
    if (pointerStart(e.touches[0], e, true)) e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (pinch) {
      if (e.touches.length >= 2) { movePinch(e); e.preventDefault(); }
      return;
    }
    if (pointerMove(e.touches[0])) e.preventDefault();
  }, { passive: false });

  function touchEnd(e) {
    if (pinch) { if (e.touches.length < 2) pinch = null; return; }
    pointerEnd();
  }
  window.addEventListener('touchend', touchEnd);
  window.addEventListener('touchcancel', touchEnd);

  // === ИНСТРУМЕНТЫ ===
  function setTool(tool) {
    currentTool = tool;
    wrapper.classList.toggle('hand-active', tool === 'hand');
    if (tool === 'hand') wrapper.style.cursor = 'grab';
    else wrapper.style.cursor = (tool === 'pen' || tool === 'eraser') ? 'none' : 'default';
    if (tool !== 'pen' && tool !== 'eraser') customCursor.style.display = 'none';
  }

  function setColor(color) { currentColor = color; }
  function setSize(size) { currentSize = parseInt(size, 10); }
  function getTool() { return currentTool; }
  function getScale() { return scale; }
  function getTransform() { return { scale, offsetX, offsetY }; }
  function clear() { strokes = []; redrawCanvas(); }

  // Холст перерисовывается при любом изменении размера (в том числе когда сворачивается чат)
  if (window.ResizeObserver) new ResizeObserver(() => redrawCanvas()).observe(wrapper);
  else window.addEventListener('resize', redrawCanvas);
  new MutationObserver(redrawCanvas).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  redrawCanvas();

  return {
    canvas, wrapper, objectsLayer,
    setTool, setColor, setSize, getTool, getScale, getTransform,
    getMousePos, getViewportCenter, clear, redrawCanvas
  };
})();
