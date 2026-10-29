const CanvasModule = (() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const wrapper = document.getElementById('canvasWrapper');
  const objectsLayer = document.getElementById('canvasObjects');

  let isDrawing = false;
  let currentTool = null;
  let currentColor = '#7c5cff';
  let currentSize = 1;
  
  // Массив нарисованных линий (хранит мировые координаты)
  let strokes = [];

  // Параметры камеры (холста)
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;
  let spacePressed = false;

  // Функция обновления визуала
  function updateTransform() {
    // Двигаем объекты (заметки, картинки)
    objectsLayer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    // Перерисовываем холст (линии и точки)
    redrawCanvas();
  }

  // Перерисовка всего холста (сетка + линии)
  function redrawCanvas() {
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    
    // Заливаем фон
    const bgColor = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фоновые точки (сетку)
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

    // Применяем камеру для рисования линий
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Рисуем все сохраненные штрихи
    strokes.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      
      stroke.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });

    ctx.restore();
  }

  // === ЗУМ ===
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    
    let newScale = scale * Math.exp(delta);
    newScale = Math.min(Math.max(0.1, newScale), 5); // От 10% до 500%

    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
    offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
    scale = newScale;

    updateTransform();
  }, { passive: false });

    // === ПЕРЕМЕЩЕНИЕ (PAN) ===
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spacePressed && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !document.activeElement.isContentEditable) {
      spacePressed = true;
      wrapper.style.cursor = 'grab';
    }
  });
  
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      spacePressed = false;
      if (!isPanning) wrapper.style.cursor = currentTool ? 'crosshair' : 'default';
    }
  });

  wrapper.addEventListener('mousedown', (e) => {
    // Двигаем доску если: зажат пробел, нажато колесико, выбран инструмент "рука", ИЛИ клик по пустому холсту левой кнопкой
    const isClickOnEmptyCanvas = e.target === canvas || e.target === objectsLayer || e.target === wrapper;
    const isHandTool = currentTool === 'hand';

    if (spacePressed || e.button === 1 || isHandTool || (e.button === 0 && isClickOnEmptyCanvas)) {
      // Если это рука или пустой клик, но мы пытаемся рисовать другим инструментом — не двигаем (если не пустой клик)
      if (!isClickOnEmptyCanvas && e.button === 0 && !isHandTool && !spacePressed) return;

      isPanning = true;
      startPanX = e.clientX - offsetX;
      startPanY = e.clientY - offsetY;
      wrapper.classList.add('panning');
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      offsetX = e.clientX - startPanX;
      offsetY = e.clientY - startPanY;
      updateTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      wrapper.classList.remove('panning');
      if (spacePressed || currentTool === 'hand') wrapper.style.cursor = 'grab';
      else wrapper.style.cursor = currentTool ? 'crosshair' : 'default';
    }
  });

  // === РИСОВАНИЕ ===
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetX) / scale,
      y: (e.clientY - rect.top - offsetY) / scale
    };
  }

  let currentStroke = null;

  wrapper.addEventListener('mousedown', (e) => {
    if (isPanning || spacePressed || e.button !== 0) return;
    if (currentTool !== 'pen' && currentTool !== 'eraser') return;

    isDrawing = true;
    const pos = getMousePos(e);
    
    currentStroke = {
      color: currentTool === 'eraser' ? getComputedStyle(document.body).getPropertyValue('--bg').trim() : currentColor,
      size: currentTool === 'eraser' ? currentSize * 8 : currentSize * 2,
      points: [pos]
    };
    strokes.push(currentStroke);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDrawing || !currentStroke) return;
    
    const pos = getMousePos(e);
    currentStroke.points.push(pos);
    redrawCanvas(); // Перерисовываем на лету
  });

  window.addEventListener('mouseup', () => {
    isDrawing = false;
    currentStroke = null;
  });

  // === ВСПОМОГАТЕЛЬНЫЕ ===
  function setTool(tool) {
    currentTool = tool;
    if (spacePressed) return;
    wrapper.style.cursor = tool ? 'crosshair' : 'default';
  }

  function setColor(color) { currentColor = color; }
  function setSize(size) { currentSize = parseInt(size); }
  function getTool() { return currentTool; }
  function clear() { strokes = []; redrawCanvas(); }

  // Инициализация
  window.addEventListener('resize', () => {
    updateTransform();
  });

  const observer = new MutationObserver(() => updateTransform());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  setTimeout(() => updateTransform(), 100);

  return {
    canvas, ctx, wrapper, objectsLayer,
    setTool, setColor, setSize, getTool,
    getMousePos, getTransform: () => ({ scale, offsetX, offsetY }),
    redrawCanvas, clear
  };
})();