const ImagesModule = (() => {
  const wrapper = CanvasModule.objectsLayer;

  function create(x, y, src) {
    const el = document.createElement('div');
    el.className = 'board-image';
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    const img = document.createElement('img');
    img.src = src;
    img.draggable = false;

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'image-resize';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'image-delete';
    del.innerHTML = '×';
    del.title = 'Удалить';

    const author = document.createElement('div');
    author.className = 'object-author';
    const userName = localStorage.getItem('userName');
    author.textContent = (userName && userName.trim()) ? userName : 'Пользователь';

    el.append(img, resizeHandle, del, author);
    wrapper.appendChild(el);

    DragUtil.draggable(el, {
      ignore: '.image-resize, .image-delete, .object-reactions',
      preventMouseDefault: true
    });
    DragUtil.resizable(resizeHandle, el, { minW: 100, keepRatio: true });

    del.addEventListener('click', (e) => { e.stopPropagation(); if (Permissions.can('edit')) el.remove(); });
    return el;
  }

  // Перетаскивание картинок прямо на доску (слушаем сам холст, а не слой объектов)
  CanvasModule.wrapper.addEventListener('dragover', (e) => e.preventDefault());
  CanvasModule.wrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!Permissions.can('edit')) { Permissions.deny(); return; }
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    const pos = CanvasModule.getMousePos(e);

    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => create(pos.x + i * 20, pos.y + i * 20, ev.target.result);
      reader.readAsDataURL(file);
    });
  });

  function attachReaction(imageEl, emoji) { Utils.toggleReaction(imageEl, emoji); }
  function clearAll() { wrapper.querySelectorAll('.board-image').forEach((el) => el.remove()); }

  return { create, clearAll, attachReaction };
})();
