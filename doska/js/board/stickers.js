const StickersModule = (() => {
  const wrapper = CanvasModule.objectsLayer;
  const canvas = CanvasModule.canvas;

  const TEXT_COLORS = ['#1a1a2e', '#7c5cff', '#4a7dff', '#ff5c8a', '#ffb84a', '#4ad9a0', '#ff3b3b', '#ffffff'];
  const NOTE_COLORS = ['#fff3b0', '#ffd6e0', '#d6e4ff', '#d5f5e3', '#e8dcff', '#ffe0b2', '#ffffff', '#2a2a42'];
  const DEFAULT_NOTE = '#fff3b0';
  const DARK_TEXT = '#3b3b3b';
  const LIGHT_TEXT = '#f2f2fa';

  function icon(name, fallback) {
    if (window.feather && feather.icons[name]) return feather.icons[name].toSvg({ width: 15, height: 15 });
    return fallback || '';
  }

  function isDark(hex) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    if (isNaN(n)) return false;
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 140;
  }

  // Цвет заметки и оттенки меню внизу подстраиваются под него
  function applyNote(el, content, color) {
    const dark = isDark(color);
    el.style.setProperty('--note', color);
    el.style.setProperty('--ink', dark ? 'rgba(255,255,255,0.8)' : 'rgba(70,52,0,0.62)');
    el.style.setProperty('--ink-hover', dark ? 'rgba(255,255,255,0.16)' : 'rgba(70,52,0,0.1)');
    el.style.setProperty('--footer-bg', dark ? 'rgba(255,255,255,0.07)' : 'rgba(70,52,0,0.05)');
    content.style.color = dark ? LIGHT_TEXT : DARK_TEXT;
  }

  // Запоминаем выделение текста внутри заметок, чтобы форматирование не терялось при клике по панели
  let lastSel = null;
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const host = (node.nodeType === 1 ? node : node.parentElement)?.closest('.sticker-content');
    if (host) lastSel = { host, range: range.cloneRange() };
  });
  function restoreSel(content) {
    if (!lastSel || lastSel.host !== content || !content.contains(lastSel.range.commonAncestorContainer)) return null;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(lastSel.range);
    return lastSel.range;
  }

  function create(x, y, color) {
    const bg = color || DEFAULT_NOTE;
    const el = document.createElement('div');
    el.className = 'sticker';
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    // листик: тень -> бумага (с загнутым уголком) -> текст и полоска под меню
    const shadow = document.createElement('div');
    shadow.className = 'sticker-shadow';
    const paper = document.createElement('div');
    paper.className = 'sticker-paper';

    const handle = document.createElement('div');
    handle.className = 'sticker-handle';

    const content = document.createElement('div');
    content.className = 'sticker-content';
    content.contentEditable = Permissions.can('edit') ? 'true' : 'false';
    content.textContent = 'Заметка';
    content.spellcheck = false;
    // читателю нельзя менять текст
    content.addEventListener('beforeinput', (e) => { if (!Permissions.can('edit')) e.preventDefault(); });
    // вставляем только обычный текст
    content.addEventListener('paste', (e) => {
      e.preventDefault();
      if (!Permissions.can('edit')) return;
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    const footer = document.createElement('div');
    footer.className = 'sticker-footer';

    paper.append(handle, content, footer);
    shadow.appendChild(paper);

    const pin = document.createElement('div');
    pin.className = 'sticker-pin';

    applyNote(el, content, bg);
    const panel = createPanel(el, content, bg);

    // загнутый уголок — он же ручка для изменения размера
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'sticker-resize';
    resizeHandle.title = 'Потяните, чтобы изменить размер';

    const author = document.createElement('div');
    author.className = 'object-author';
    const userName = localStorage.getItem('userName');
    author.textContent = (userName && userName.trim()) ? userName : 'Пользователь';

    el.append(shadow, pin, panel, resizeHandle, author);
    wrapper.appendChild(el);

    if (Permissions.can('edit')) {
      content.focus(); // сразу, чтобы на телефоне открылась клавиатура
      setTimeout(() => {
        content.focus();
        document.execCommand('selectAll', false, null);
      }, 10);
    }

    DragUtil.draggable(el, {
      ignore: '.sticker-panel, .sticker-resize, .object-reactions',
      onDragStart: () => content.blur(),
      // пока заметка редактируется, перетаскивание внутри текста выделяет текст
      canStart: (e) => !(document.activeElement === content && e.target.closest('.sticker-content'))
    });
    DragUtil.resizable(resizeHandle, el, {
      minW: () => parseFloat(getComputedStyle(el).minWidth) || 270,
      minH: () => parseFloat(getComputedStyle(el).minHeight) || 200
    });

    return el;
  }

  function createPanel(stickerEl, content, initialBg) {
    const panel = document.createElement('div');
    panel.className = 'sticker-panel';
    // клики по панели не должны снимать выделение (кроме выбора размера шрифта)
    panel.addEventListener('mousedown', (e) => { if (!e.target.closest('select')) e.preventDefault(); });

    const formats = [['bold', '<b>B</b>', 'Жирный'], ['italic', '<i>I</i>', 'Курсив'], ['underline', '<u>U</u>', 'Подчёркнутый']];
    formats.forEach(([cmd, html, title]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = title;
      btn.innerHTML = html;
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        content.focus();
        restoreSel(content);
        document.execCommand(cmd);
      });
      panel.appendChild(btn);
    });

    const fontSize = document.createElement('select');
    fontSize.className = 'sticker-font-size';
    fontSize.title = 'Размер текста';
    ['12', '14', '16', '20', '24', '32'].forEach((sz) => {
      const opt = document.createElement('option');
      opt.value = sz;
      opt.textContent = sz;
      if (sz === '16') opt.selected = true;
      fontSize.appendChild(opt);
    });
    fontSize.addEventListener('change', () => { content.style.fontSize = fontSize.value + 'px'; });
    panel.appendChild(fontSize);

    // Цвет текста: выделенный фрагмент, а если ничего не выделено — весь текст
    panel.appendChild(createColorPicker({
      label: 'A', palette: TEXT_COLORS, title: 'Цвет текста',
      initial: isDark(initialBg) ? LIGHT_TEXT : DARK_TEXT,
      onPick: (color) => {
        content.focus();
        const range = restoreSel(content);
        if (range && !range.collapsed) document.execCommand('foreColor', false, color);
        else content.style.color = color;
      }
    }));

    // Цвет заметки
    panel.appendChild(createColorPicker({
      iconName: 'droplet', palette: NOTE_COLORS, title: 'Цвет заметки', initial: initialBg,
      onPick: (color) => applyNote(stickerEl, content, color)
    }));

    const del = document.createElement('button');
    del.type = 'button';
    del.title = 'Удалить';
    del.className = 'sticker-delete';
    del.innerHTML = icon('trash-2', '🗑');
    del.addEventListener('mousedown', (e) => { e.preventDefault(); if (Permissions.can('edit')) stickerEl.remove(); });
    panel.appendChild(del);

    return panel;
  }

  function createColorPicker({ label, iconName, palette, title, initial, onPick }) {
    const picker = document.createElement('div');
    picker.className = 'color-picker';
    picker.title = title;
    picker.style.setProperty('--picked', initial);
    picker.innerHTML = label ? `<span class="cp-label">${label}</span>` : icon(iconName);
    let current = initial;

    const menu = document.createElement('div');
    menu.className = 'color-menu';

    const apply = (c) => {
      current = c;
      picker.style.setProperty('--picked', c);
      onPick(c);
    };

    palette.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-menu-item';
      btn.style.background = c;
      btn.title = c;
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); apply(c); });
      menu.appendChild(btn);
    });

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'color-menu-plus';
    plus.title = 'Свой цвет';
    plus.innerHTML = icon('plus', '+');
    plus.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (ColorPicker.isOpen()) { ColorPicker.close(); return; }
      picker.classList.add('open'); // держим меню открытым, пока открыта палитра
      ColorPicker.open({
        anchor: menu,
        exempt: [plus],
        color: current,
        onChange: apply,
        onClose: () => picker.classList.remove('open')
      });
    });
    menu.appendChild(plus);

    // на телефоне наведения нет — меню цвета открывается и закрывается касанием
    picker.addEventListener('click', (e) => {
      if (e.target.closest('.color-menu')) return;
      if (window.matchMedia('(hover: none)').matches) picker.classList.toggle('open');
    });

    picker.appendChild(menu);
    return picker;
  }

  document.addEventListener('click', (e) => {
    if (ColorPicker.isOpen()) return;
    document.querySelectorAll('.color-picker.open').forEach((p) => { if (!p.contains(e.target)) p.classList.remove('open'); });
  });

  function clearAll() {
    wrapper.querySelectorAll('.sticker').forEach((el) => el.remove());
  }

  function attachReaction(stickerEl, emoji) { Utils.toggleReaction(stickerEl, emoji); }

  canvas.addEventListener('mousedown', (e) => {
    if (CanvasModule.getTool() !== 'sticker') return;
    if (!Permissions.can('edit')) { Permissions.deny(); return; }
    const pos = CanvasModule.getMousePos(e);
    create(pos.x, pos.y);
    document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.remove('active'));
    CanvasModule.setTool(null);
  });

  // Вызывается при смене роли: читателю текст в заметках редактировать нельзя
  function refreshEditable() {
    const editable = Permissions.can('edit');
    wrapper.querySelectorAll('.sticker-content').forEach((c) => {
      c.contentEditable = editable ? 'true' : 'false';
      if (!editable) c.blur();
    });
  }

  return { create, clearAll, attachReaction, refreshEditable };
})();
