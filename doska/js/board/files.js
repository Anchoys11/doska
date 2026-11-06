const FilesModule = (() => {
  const wrapper = CanvasModule.objectsLayer;

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
      e.stopPropagation(); window.open(fileUrl, '_blank');
    });

    el.querySelector('.file-delete').addEventListener('click', (e) => {
      e.stopPropagation(); el.remove();
    });

    return el;
  }

  function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDown = false;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      if (CanvasModule.getTool() === 'hand') return;
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

  wrapper.addEventListener('dragover', (e) => e.preventDefault());
  wrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files.length) return;
    const pos = CanvasModule.getMousePos(e);

    Array.from(files).forEach((file, i) => {
      if (file.type.startsWith('image/')) return; 
      const fileUrl = URL.createObjectURL(file);
      create(pos.x + i * 20, pos.y + i * 20, file.name, fileUrl, file.type);
    });
  });

  return { create };
})();