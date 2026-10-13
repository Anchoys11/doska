const CanvasModule = (() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const wrapper = canvas.parentElement;

  let isDrawing = false;
  let currentTool = null;
  let currentColor = '#7c5cff';
  let currentSize = 1;
  let lastX = 0;
  let lastY = 0;

  function resize() {
  const newWidth = wrapper.clientWidth;
  const newHeight = wrapper.clientHeight;

  // Защита: если холст ещё не отрисован — выходим
  if (newWidth === 0 || newHeight === 0) return;

  // Сохраняем только если есть что сохранять
  let imageData = null;
  if (canvas.width > 0 && canvas.height > 0) {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  canvas.width = newWidth;
  canvas.height = newHeight;

  if (imageData) {
    ctx.putImageData(imageData, 0, 0);
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

  function setTool(tool) {
  currentTool = tool;
  if (tool === 'eraser') canvas.style.cursor = 'cell';
  else if (tool === 'sticker') canvas.style.cursor = 'copy';
  else if (tool === 'image') canvas.style.cursor = 'copy';
  else if (tool === 'pen') canvas.style.cursor = 'crosshair';
  else canvas.style.cursor = 'default';
}

  function setColor(color) { currentColor = color; }
  function setSize(size) { currentSize = parseInt(size); }

  function startDrawing(e) {
    if (!currentTool) return;               // ничего не выбрано
  if (currentTool === 'sticker') return;
  if (currentTool === 'image') return;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  }

  function draw(e) {
    if (!isDrawing) return;
    if (currentTool === 'sticker') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    if (currentTool === 'eraser') {
      ctx.strokeStyle = getComputedStyle(document.body).backgroundColor;
      ctx.lineWidth = currentSize * 4;
    } else {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize * 2;
    }
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function stopDrawing() { isDrawing = false; }

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Инициализация
  window.addEventListener('resize', resize);
  resize();

  canvas.addEventListener('mousedown', startDrawing);
  document.addEventListener('mousemove', draw);   // ← было canvas
  document.addEventListener('mouseup', stopDrawing);   // ← было canvas

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    startDrawing({ clientX: t.clientX, clientY: t.clientY });
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    draw({ clientX: t.clientX, clientY: t.clientY });
  });
  canvas.addEventListener('touchend', stopDrawing);

  return {
    canvas, ctx, wrapper,
    setTool, setColor, setSize,
    clear,
    getTool: () => currentTool,
  };
})();