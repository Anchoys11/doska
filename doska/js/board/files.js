const FilesModule = (() => {
  const wrapper = CanvasModule.objectsLayer;
  const canvas = CanvasModule.canvas;

  function create(x, y, fileName, fileUrl, fileType) {
    const el = document.createElement('div');
    el.className = 'board-file';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.background = 'var(--card)';
    
    let icon = 'file';
    if (fileType.includes('pdf')) icon = 'file-text';
    if (fileType.includes('zip') || fileType.includes('rar')) icon = 'archive';
    
    el.innerHTML = `
      <div class="file-icon"><i data-feather="${icon}"></i></div>
      <div class="file-name">${fileName}</div>
      <div class="file-actions">
        <button class="file-open" title="Открыть"><i data-feather="external-link"></i></button>
        <button class="file-delete" title="Удалить"><i data-feather="trash-2"></i></button>
      </div>
    `;

    wrapper.appendChild(el);
    if (window.feather) feather.replace();

    makeDraggable(el);

    el.querySelector('.file-open').addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(fileUrl, '_blank');
    });

    el.querySelector('.file-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      el.remove();
    });

    return el;
  }

  function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDown = false;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      if (typeof ReactionsModule !== 'undefined' && ReactionsModule.getReaction()) return;

      isDown = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      el.style.left = (e.clientX - offsetX) + 'px';
      el.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => { isDown = false; });
  }

  canvas.addEventListener('dragover', (e) => e.preventDefault());

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const pos = CanvasModule.getMousePos(e);

    Array.from(files).forEach((file, i) => {
      const fileUrl = URL.createObjectURL(file);
      create(pos.x + i * 20, pos.y + i * 20, file.name, fileUrl, file.type);
    });
  });

    // ===== ЛОГИКА КНОПКИ ДЛЯ ЗАГРУЗКИ ФАЙЛОВ =====
  const fileInput = document.getElementById('fileInput');

  // Открываем проводник при клике на иконку "Файл" в панели
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tool[data-tool="file"]');
    if (!btn) return;
    fileInput.click();
  });

  // Когда файл выбран в проводнике
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      const fileUrl = URL.createObjectURL(file);

      // Размещаем файл в центре экрана
      const transform = CanvasModule.getTransform();
      const canvas = CanvasModule.canvas;
      const rect = canvas.getBoundingClientRect();
      
      // Высчитываем центр экрана в мировых координатах
      const centerX = (rect.width / 2 - transform.offsetX) / transform.scale;
      const centerY = (rect.height / 2 - transform.offsetY) / transform.scale;

      create(centerX - 100, centerY - 100, file.name, fileUrl, file.type);
      fileInput.value = ''; // Очищаем инпут
    });
  }

  return { create };
})();