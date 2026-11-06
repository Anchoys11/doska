const CanvasModule = (() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const wrapper = document.getElementById('canvasWrapper');
  const objectsLayer = document.getElementById('canvasObjects');

  let isDrawing = false;
  let currentTool = null;
  let currentColor = '#7c5cff';
  let currentSize = 1;
  let strokes = [];
  let currentStroke = null;

  // Параметры камеры
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;

  // === КАСТОМНЫЙ КУРСОР ===
  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);

  window.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';

    if (currentTool === 'pen' || currentTool === 'eraser') {
      customCursor.style.display = 'block';
      const displaySize = (currentTool === 'eraser' ? currentSize * 8 : currentSize * 2) * scale;
      customCursor.style.width = Math.max(displaySize, 8) + 'px';
      customCursor.style.height = Math.max(displaySize, 8) + 'px';
      customCursor.style.backgroundColor = currentTool === 'eraser' ? 'transparent' : currentColor;
      customCursor.style.border = '2px solid white';
    } else {
      customCursor.style.display = 'none';
    }
  });

  // === ОТРИСОВКА ===
  function redrawCanvas() {
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Сетка
    const dotColor = getComputedStyle(document.body).getPropertyValue('--border').trim();
    const gap = 40 * scale;
    let startX = offsetX % gap;
    let startY = offsetY % gap;
    if (startX > 0) startX -= gap;
    if (startY > 0) startY -= gap;
    
    ctx.fillStyle = dotColor;
    for (let x = startX; x < canvas.width; x += gap) {
      for (let y = startY; y < canvas.height; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Линии
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      ctx.beginPath();
      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.size;
      stroke.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
    ctx.restore();
  }

  function updateTransform() {
    objectsLayer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    redrawCanvas();
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetX) / scale,
      y: (e.clientY - rect.top - offsetY) / scale
    };
  }

  // === ЗУМ ===
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    let newScale = scale * Math.exp(delta);
    newScale = Math.min(Math.max(0.1, newScale), 3);

    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
    offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
    scale = newScale;
    updateTransform();
  }, { passive: false });

  // === МЫШЬ (ПЕРЕМЕЩЕНИЕ И РИСОВАНИЕ) ===
  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Только левая кнопка

    // 1. Если рука — двигаем доску
    if (currentTool === 'hand') {
      isPanning = true;
      startPanX = e.clientX - offsetX;
      startPanY = e.clientY - offsetY;
      wrapper.style.cursor = 'grabbing';
      return;
    }

    // 2. Если карандаш или ластик — рисуем
    if (currentTool === 'pen' || currentTool === 'eraser') {
      isDrawing = true;
      const pos = getMousePos(e);
      currentStroke = {
        color: currentTool === 'eraser' ? 'rgba(0,0,0,1)' : currentColor,
        size: currentTool === 'eraser' ? currentSize * 8 : currentSize * 2,
        points: [pos],
        isEraser: currentTool === 'eraser'
      };
      strokes.push(currentStroke);
    }
  });

  window.addEventListener('mousemove', (e) => {
    // Движение доски
    if (isPanning) {
      offsetX = e.clientX - startPanX;
      offsetY = e.clientY - startPanY;
      updateTransform();
      return;
    }

    // Рисование
    if (isDrawing && currentStroke) {
      currentStroke.points.push(getMousePos(e));
      redrawCanvas();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      wrapper.style.cursor = 'grab';
    }
    isDrawing = false;
    currentStroke = null;
  });

  // === ИНСТРУМЕНТЫ ===
  function setTool(tool) {
    currentTool = tool;
    if (tool === 'hand') {
      wrapper.classList.add('hand-active');
      wrapper.style.cursor = 'grab';
    } else {
      wrapper.classList.remove('hand-active');
      wrapper.style.cursor = (tool === 'pen' || tool === 'eraser') ? 'none' : 'default';
    }
  }

  function setColor(color) { currentColor = color; }
  function setSize(size) { currentSize = parseInt(size); }
  function getTool() { return currentTool; }
  function clear() { strokes = []; redrawCanvas(); }

  window.addEventListener('resize', redrawCanvas);
  const observer = new MutationObserver(() => redrawCanvas());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  setTimeout(redrawCanvas, 100);

  return { 
    canvas, objectsLayer,
    setTool, setColor, setSize, getTool, getMousePos, clear, redrawCanvas 
  };
})();