const ImagesModule = (() => {
  const wrapper = CanvasModule.objectsLayer;
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
  let startX = 0, startY = 0, startW = 0, startH = 0;
  let isResizing = false;
  let aspectRatio = 1;

  handle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = el.offsetWidth;
    startH = el.offsetHeight;
    aspectRatio = startW / startH;   // ← сохраняем пропорции
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const dx = e.clientX - startX;
    const newW = Math.max(100, startW + dx);
    
    // Высчитываем высоту по пропорции (чтобы картинка не плющилась)
    const newH = newW / aspectRatio;

    el.style.width = newW + 'px';
    el.style.height = newH + 'px';
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
        create(
  pos.x + i * 20,  
  pos.y + i * 20,  
  event.target.result
);};
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
  function attachReaction(stickerEl, emoji) {
  let reactionsBar = stickerEl.querySelector('.sticker-reactions');
  if (!reactionsBar) {
    reactionsBar = document.createElement('div');
    reactionsBar.className = 'sticker-reactions';
    stickerEl.appendChild(reactionsBar);
  }

  // 1. Проверяем, есть ли УЖЕ реакция от этого пользователя
  let existingUserReaction = reactionsBar.querySelector('.reaction-chip.active-user');
  
  if (existingUserReaction) {
    if (existingUserReaction.dataset.emoji === emoji) {
      // Если кликнули на ту же реакцию — убираем её
      let count = parseInt(existingUserReaction.dataset.count) - 1;
      if (count <= 0) {
        existingUserReaction.remove();
        if (reactionsBar.children.length === 0) reactionsBar.remove();
      } else {
        existingUserReaction.dataset.count = count;
        existingUserReaction.innerHTML = `${emoji} <span>${count}</span>`;
      }
      return;
    } else {
      // Если кликнули на другую — убираем старую
      let count = parseInt(existingUserReaction.dataset.count) - 1;
      if (count <= 0) {
        existingUserReaction.remove();
      } else {
        existingUserReaction.dataset.count = count;
        existingUserReaction.innerHTML = `${existingUserReaction.dataset.emoji} <span>${count}</span>`;
      }
      existingUserReaction.classList.remove('active-user');
    }
  }

  // 2. Добавляем новую реакцию
  let chip = reactionsBar.querySelector(`[data-emoji="${emoji}"]`);
  if (chip) {
    let count = parseInt(chip.dataset.count) + 1;
    chip.dataset.count = count;
    chip.innerHTML = `${emoji} <span>${count}</span>`;
    chip.classList.add('active-user'); // Помечаем, что это реакция юзера
  } else {
    chip = document.createElement('button');
    chip.className = 'reaction-chip active-user';
    chip.dataset.emoji = emoji;
    chip.dataset.count = 1;
    chip.innerHTML = `${emoji} <span>1</span>`;
    reactionsBar.appendChild(chip);
  }
}

  // ===== ОЧИСТКА =====
  function clearAll() {
    wrapper.querySelectorAll('.board-image').forEach(el => el.remove());
  }

  return { create, clearAll, attachReaction };
})();