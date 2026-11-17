const FilesModule = (() => {
  const wrapper = CanvasModule.objectsLayer;

  function create(x, y, fileName, fileUrl, fileType) {
    const el = document.createElement('div');
    el.className = 'board-file';
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    let icon = 'file';
    const type = fileType || '';
    if (type.includes('pdf')) icon = 'file-text';
    if (type.includes('zip') || type.includes('rar')) icon = 'archive';

    el.innerHTML = `
      <div class="file-icon"><i data-feather="${icon}"></i></div>
      <div class="file-name">${Utils.escapeHtml(fileName)}</div>
      <div class="file-actions">
        <button type="button" class="file-open" title="Открыть"><i data-feather="external-link"></i></button>
        <button type="button" class="file-delete" title="Удалить"><i data-feather="trash-2"></i></button>
      </div>
    `;

    wrapper.appendChild(el);
    if (window.feather) feather.replace();

    DragUtil.draggable(el, { ignore: 'button, .object-reactions' });

    el.querySelector('.file-open').addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(fileUrl, '_blank');
    });
    el.querySelector('.file-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (Permissions.can('edit')) el.remove();
    });

    return el;
  }

  CanvasModule.wrapper.addEventListener('dragover', (e) => e.preventDefault());
  CanvasModule.wrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!Permissions.can('edit')) return;
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    const pos = CanvasModule.getMousePos(e);

    Array.from(files).forEach((file, i) => {
      if (file.type.startsWith('image/')) return; // картинки обрабатывает ImagesModule
      create(pos.x + i * 20, pos.y + i * 20, file.name, URL.createObjectURL(file), file.type);
    });
  });

  function clearAll() { wrapper.querySelectorAll('.board-file').forEach((el) => el.remove()); }

  return { create, clearAll };
})();
