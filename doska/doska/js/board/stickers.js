const StickersModule = (() => {
  const wrapper = CanvasModule.wrapper;
  const canvas = CanvasModule.canvas;

  // ===== СОЗДАНИЕ ЗАМЕТКИ =====
  function create(x, y, color) {
    const el = document.createElement('div');
    el.className = 'sticker';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.background = color || '#7c5cff';

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

    // B / I / U
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

    // Размер
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

    // Цвет текста
    panel.appendChild(createColorPicker('A', (color) => {
      content.focus();
      restoreSelection();
      document.execCommand('foreColor', false, color);
      saveSelection();
    }, 'Цвет текста'));

    // Цвет фона
    panel.appendChild(createColorPicker('🎨', (color) => {
      stickerEl.style.background = color;
    }, 'Цвет фона'));

    // Удалить
    const del = document.createElement('button');
    del.innerHTML = '🗑️';
    del.addEventListener('mousedown', (e) => {
      e.preventDefault();
      stickerEl.remove();
    });
    panel.appendChild(del);

    return panel;
  }

  // ===== ПАЛИТРА ЦВЕТОВ =====
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
      const w = Math.max(140, startW + (e.clientX - startX));
      const h = Math.max(100, startH + (e.clientY - startY));
      el.style.width = w + 'px';
      el.style.height = h + 'px';
    });

    document.addEventListener('mouseup', () => { isResizing = false; });
  }

  // ===== ОЧИСТКА =====
  function clearAll() {
    wrapper.querySelectorAll('.sticker').forEach(el => el.remove());
  }

  // ===== КЛИК ПО ХОЛСТУ =====
  canvas.addEventListener('mousedown', (e) => {
    if (CanvasModule.getTool() !== 'sticker') return;
    const rect = canvas.getBoundingClientRect();
    create(e.clientX - rect.left, e.clientY - rect.top);

    document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.remove('active'));
    CanvasModule.setTool(null);
  });

// ===== РЕАКЦИИ НА ЗАМЕТКЕ =====
function attachReaction(stickerEl, emoji) {
  let reactionsBar = stickerEl.querySelector('.sticker-reactions');
  if (!reactionsBar) {
    reactionsBar = document.createElement('div');
    reactionsBar.className = 'sticker-reactions';
    stickerEl.appendChild(reactionsBar);
  }

  // Ищем уже существующую реакцию с этим эмодзи
  let chip = reactionsBar.querySelector(`[data-emoji="${emoji}"]`);
  if (chip) {
    // Увеличиваем счётчик
    let count = parseInt(chip.dataset.count) + 1;
    chip.dataset.count = count;
    chip.textContent = `${emoji} ${count}`;
  } else {
    // Создаём новую
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

return { create, clearAll, attachReaction };
})();

