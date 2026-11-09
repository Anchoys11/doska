const ImagesModule = (() => {
  const wrapper = CanvasModule.objectsLayer;
  const canvas = CanvasModule.canvas;

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
    del.className = 'image-delete';
    del.innerHTML = '×';

    el.appendChild(img);
    el.appendChild(resizeHandle);
    el.appendChild(del);
    wrapper.appendChild(el);

    makeDraggable(el);
    makeResizable(el, resizeHandle);

    del.addEventListener('click', (e) => {
      e.stopPropagation();
      el.remove();
    });

    return el;
  }

  function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDown = false;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.image-resize')) return;
      if (e.target.closest('.image-delete')) return;
      if (e.target.closest('.image-reactions')) return;
      if (CanvasModule.getTool() === 'hand') return;
      if (typeof ReactionsModule !== 'undefined' && ReactionsModule.getReaction()) return;

      isDown = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      e.stopPropagation();
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      el.style.left = (e.clientX - offsetX) + 'px';
      el.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => { isDown = false; });
  }

  function makeResizable(el, handle) {
    let startX = 0, startY = 0, startW = 0, startH = 0, isResizing = false;
    let aspectRatio = 1;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = el.offsetWidth;
      startH = el.offsetHeight;
      aspectRatio = startW / startH;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const newW = Math.max(100, startW + dx);
      const newH = newW / aspectRatio;

      el.style.width = newW + 'px';
      el.style.height = newH + 'px';
    });

    document.addEventListener('mouseup', () => { isResizing = false; });
  }

  wrapper.addEventListener('dragover', (e) => e.preventDefault());
  wrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files.length) return;
    const pos = CanvasModule.getMousePos(e);

    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        create(pos.x + i * 20, pos.y + i * 20, event.target.result);
      };
      reader.readAsDataURL(file);
    });
  });

  function attachReaction(imageEl, emoji) {
    let reactionsBar = imageEl.querySelector('.image-reactions');
    if (!reactionsBar) {
      reactionsBar = document.createElement('div');
      reactionsBar.className = 'image-reactions';
      imageEl.appendChild(reactionsBar);
    }

    let existingUserReaction = reactionsBar.querySelector('.reaction-chip.active-user');
    
    if (existingUserReaction) {
      if (existingUserReaction.dataset.emoji === emoji) {
        existingUserReaction.remove();
        if (reactionsBar.children.length === 0) reactionsBar.remove();
        return;
      } else {
        existingUserReaction.remove();
      }
    }

    let chip = reactionsBar.querySelector(`[data-emoji="${emoji}"]`);
    if (chip) {
      let count = parseInt(chip.dataset.count) + 1;
      chip.dataset.count = count;
      chip.innerHTML = `${emoji} <span>${count}</span>`;
      chip.classList.add('active-user');
    } else {
      chip = document.createElement('button');
      chip.className = 'reaction-chip active-user';
      chip.dataset.emoji = emoji;
      chip.dataset.count = 1;
      chip.innerHTML = `${emoji} <span>1</span>`;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        chip.remove();
        if (reactionsBar.children.length === 0) reactionsBar.remove();
      });
      reactionsBar.appendChild(chip);
    }
  }

  function clearAll() {
    wrapper.querySelectorAll('.board-image').forEach(el => el.remove());
  }

  return { create, clearAll, attachReaction };
})();