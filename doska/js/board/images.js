const ImagesModule = (() => {
  const wrapper = CanvasModule.wrapper;
  const canvas = CanvasModule.canvas;

  // ===== СОЗДАНИЕ КАРТИНКИ =====
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

  // ===== ПЕРЕТАСКИВАНИЕ =====
  function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDown = false;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.image-resize')) return;
      if (e.target.closest('.image-delete')) return;
      if (e.target.closest('.image-reactions')) return;
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

  // ===== РЕСАЙЗ =====
  function makeResizable(el, handle) {
    let startX = 0, startY = 0, startW = 0, startH = 0, isResizing = false;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = el.offsetWidth;
      startH = el.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
       if (!isResizing) return;
      const w = Math.max(100, startW + (e.clientX - startX));
      const h = Math.max(80, startH + (e.clientY - startY));
      el.style.width = w + 'px';
      el.style.height = h + 'px'; 
    });

    document.addEventListener('mouseup', () => { isResizing = false; });
  }

  // ===== DRAG-AND-DROP =====
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const rect = canvas.getBoundingClientRect();

    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        create(e.clientX - rect.left + i * 20, e.clientY - rect.top + i * 20, event.target.result);
      };
      reader.readAsDataURL(file);
    });
  });

  // ===== КНОПКА «КАРТИНКА» =====
  const imageInput = document.getElementById('imageInput');
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tool[data-tool="image"]');
    if (!btn) return;
    imageInput.click();
  });

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const x = canvas.width / 2 - 120;
        const y = canvas.height / 2 - 90;
        create(x, y, event.target.result);
      };
      reader.readAsDataURL(file);
      imageInput.value = '';
    });
  }

  // ===== РЕАКЦИИ НА КАРТИНКЕ =====
  function attachReaction(imageEl, emoji) {
    let reactionsBar = imageEl.querySelector('.image-reactions');
    if (!reactionsBar) {
      reactionsBar = document.createElement('div');
      reactionsBar.className = 'image-reactions';
      imageEl.appendChild(reactionsBar);
    }

    let chip = reactionsBar.querySelector(`[data-emoji="${emoji}"]`);
    if (chip) {
      let count = parseInt(chip.dataset.count) + 1;
      chip.dataset.count = count;
      chip.textContent = `${emoji} ${count}`;
    } else {
      chip = document.createElement('button');
      chip.className = 'reaction-chip';
      chip.dataset.emoji = emoji;
      chip.dataset.count = 1;
      chip.textContent = `${emoji} 1`;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        let count = parseInt(chip.dataset.count) - 1;
        if (count <= 0) chip.remove();
        else {
          chip.dataset.count = count;
          chip.textContent = `${emoji} ${count}`;
        }
      });
      reactionsBar.appendChild(chip);
    }
  }

  // ===== ОЧИСТКА =====
  function clearAll() {
    wrapper.querySelectorAll('.board-image').forEach(el => el.remove());
  }

  return { create, clearAll, attachReaction };
})();