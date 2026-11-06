const CameraModule = (() => {
  const wrapper = document.getElementById('canvasWrapper');
  const objectsLayer = document.getElementById('canvasObjects');

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;

  function updateTransform() {
    objectsLayer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    if (window.CanvasModule && CanvasModule.redrawCanvas) {
      CanvasModule.redrawCanvas();
    }
  }

  // ЗУМ
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

  // ПЕРЕМЕЩЕНИЕ (только мышь и рука)
  wrapper.addEventListener('mousedown', (e) => {
    // Если нажата ЛЕВАЯ кнопка мыши и выбран инструмент "Рука"
    if (e.button === 0 && window.CanvasModule && CanvasModule.getTool() === 'hand') {
      isPanning = true;
      startPanX = e.clientX - offsetX;
      startPanY = e.clientY - offsetY;
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
    }
  });

  return { updateTransform, getTransform: () => ({ scale, offsetX, offsetY }) };
})();