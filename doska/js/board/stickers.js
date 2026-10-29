const StickersModule = (() => {
  const wrapper = CanvasModule.objectsLayer;
  const canvas = CanvasModule.canvas;

  // ===== СОЗДАНИЕ ЗАМЕТКИ =====
  function create(x, y, color) {
    const el = document.createElement('div');
    el.className = 'sticker';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.background = color || '#fff3b0';

    const content = document.createElement('div');
    content.className = 'sticker-content';
    content.contentEditable = true;
    content.textContent = 'Заметка';
    content.spellcheck = false;

    const panel = createPanel(el, content);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'sticker-resize';

    el.appendChild(content);
    el.appendChild(panel);
    el.appendChild(resizeHandle); 
    wrapper.appendChild(el);

    setTimeout(() => {
      content.focus();
      document.execCommand('selectAll', false, null);
    }, 10);

    makeDraggable(el, content);
    makeResizable(el, resizeHandle);

    return el;
  }

  // ===== ПАНЕЛЬ =====
  function createPanel(stickerEl, content) {
    const panel = document.createElement('div');
    panel.className = 'sticker-panel';

    let savedSelection = null;

    function saveSelection() {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) savedSelection = sel.getRangeAt(0).cloneRange();
    }
    function restoreSelection() {
      if (!savedSelection) return;
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection);
    }

    ['bold', 'italic', 'underline'].forEach(cmd => {
      const btn = document.createElement('button');
      btn.innerHTML = cmd === 'bold' ? '<b>B</b>' : cmd === 'italic' ? '<i>I</i>' : '<u>U</u>';
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        content.focus();
        restoreSelection();
        document.execCommand(cmd);
        saveSelection();
      });
      panel.appendChild(btn);
    });

    const fontSize = document.createElement('select');
    fontSize.className = 'sticker-font-size';
    ['12', '14', '16', '20', '24', '32'].forEach(sz => {
      const opt = document.createElement('option');
      opt.value = sz;
      opt.textContent = sz;
      if (sz === '16') opt.selected = true;
      fontSize.appendChild(opt);
    });
    fontSize.addEventListener('change', () => {
      content.style.fontSize = fontSize.value + 'px';
    });
    panel.appendChild(fontSize);

    panel.appendChild(createColorPicker('A', (color) => {
      content.focus();
      restoreSelection();
      document.execCommand('foreColor', false, color);
      saveSelection();
    }, 'Цвет текста'));

    panel.appendChild(createColorPicker('🎨', (color) => {
      stickerEl.style.background = color;
    }, 'Цвет фона'));

    const del = document.createElement('button');
    del.innerHTML = '🗑️';
    del.addEventListener('mousedown', (e) => {
      e.preventDefault();
      stickerEl.remove();
    });
    panel.appendChild(del);

    return panel;
  }

  // ===== ПАЛИТРА =====
  function createColorPicker(label, onPick, title) {
    const picker = document.createElement('div');
    picker.className = 'color-picker';
    picker.title = title;
    picker.innerHTML = `<span>${label}</span>`;

    const menu = document.createElement('div');
    menu.className = 'color-menu';

    ['#1a1a2e', '#7c5cff', '#4a7dff', '#ff5c8a', '#ffb84a', '#4ad9a0', '#ff3b3b', '#ffffff'].forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'color-menu-item';
      btn.style.background = c;
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onPick(c);
      });
      menu.appendChild(btn);
    });

    const plus = document.createElement('button');
    plus.className = 'color-menu-plus';
    plus.textContent = '+';
    plus.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const inp = document.createElement('input');
      inp.type = 'color';
      inp.value = '#7c5cff';
      inp.addEventListener('input', () => onPick(inp.value));
      inp.click();
    });
    menu.appendChild(plus);

    picker.appendChild(menu);
    return picker;
  }

  // ===== ПЕРЕТАСКИВАНИЕ =====
  function makeDraggable(el, content) {
    let offsetX = 0, offsetY = 0;
    let startX = 0, startY = 0;
    let isDown = false;
    let isDragging = false;
    const THRESHOLD = 3;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.sticker-panel')) return;
      if (e.target.closest('.color-menu')) return;
      if (e.target.closest('.sticker-resize')) return;
      if (e.target.closest('.sticker-reactions')) return;
      if (typeof ReactionsModule !== 'undefined' && ReactionsModule.getReaction()) return;

      isDown = true;
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!isDragging && distance > THRESHOLD) {
        isDragging = true;
        content.blur();
        document.body.style.userSelect = 'none';
      }

      if (isDragging) {
        el.style.left = (e.clientX - offsetX) + 'px';
        el.style.top = (e.clientY - offsetY) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDown = false;
      isDragging = false;
      document.body.style.userSelect = '';
    });
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
      const w = Math.max(260, startW + (e.clientX - startX));
      const h = Math.max(140, startH + (e.clientY - startY));
      el.style.width = w + 'px';
      el.style.height = h + 'px';
    });

    document.addEventListener('mouseup', () => { isResizing = false; });
  }

  // ===== РЕАКЦИИ НА ЗАМЕТКЕ =====
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
    wrapper.querySelectorAll('.sticker').forEach(el => el.remove());
  }

  // ===== КЛИК ПО ХОЛСТУ =====
  canvas.addEventListener('mousedown', (e) => {
    if (CanvasModule.getTool() !== 'sticker') return;
    const pos = CanvasModule.getMousePos(e);
    create(pos.x, pos.y);

    document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.remove('active'));
    CanvasModule.setTool(null);
  });

  return { create, clearAll, attachReaction };
})();