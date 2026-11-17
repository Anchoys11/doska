const isTouchOnly = () => window.matchMedia('(hover: none)').matches;
const isNarrow = () => Utils.isCompact();

// ===== ИНСТРУМЕНТЫ =====
document.querySelectorAll('.tool[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    // всё, кроме «руки», требует права редактора
    if (tool !== 'hand' && !Permissions.can('edit')) { Permissions.deny(); return; }
    // «Картинка» и «Файл» только открывают выбор файла и не становятся активным инструментом
    if (tool === 'image' || tool === 'file') return;

    // повторное нажатие на активный инструмент выключает его (например, «рука» перестаёт двигать доску)
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      CanvasModule.setTool(null);
      return;
    }

    document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    CanvasModule.setTool(tool);
    ReactionsModule.clearReaction();
  });
});

// ===== ВЫПАДАЮЩИЕ МЕНЮ =====
const dropdowns = document.querySelectorAll('.dropdown');

function fitMenu(dd) {
  const menu = dd.querySelector('.dropdown-menu');
  const trigger = dd.querySelector('.dropdown-trigger');
  if (!menu || !trigger) return;
  dd.classList.remove('drop-up');
  menu.style.removeProperty('--shift');

  if (isNarrow()) {
    // на телефоне меню открывается вверх — следим, чтобы не вылезало за края экрана
    const r = dd.getBoundingClientRect();
    const w = menu.offsetWidth;
    const left = r.left + r.width / 2 - w / 2;
    const clamped = Math.min(Math.max(left, 8), document.documentElement.clientWidth - w - 8);
    menu.style.setProperty('--shift', (clamped - left) + 'px');
  } else if (trigger.getBoundingClientRect().top + menu.offsetHeight > document.documentElement.clientHeight - 8) {
    dd.classList.add('drop-up');
  }
}

function closeDropdowns() {
  dropdowns.forEach((d) => d.classList.remove('open'));
}

dropdowns.forEach((dd) => {
  dd.addEventListener('mouseenter', () => fitMenu(dd));
  const trigger = dd.querySelector('.dropdown-trigger');
  if (!trigger) return;
  trigger.addEventListener('click', (e) => {
    if (!isTouchOnly()) return; // на компьютере меню открывается при наведении
    e.stopPropagation();
    const wasOpen = dd.classList.contains('open');
    closeDropdowns();
    if (!wasOpen) { fitMenu(dd); dd.classList.add('open'); }
  });
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.dropdown, .cp-pop')) return;
  closeDropdowns();
});

// ===== РАЗМЕР =====
document.querySelectorAll('.size-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-option').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    CanvasModule.setSize(btn.dataset.size);
  });
});

// ===== ЦВЕТ =====
const colorTrigger = document.getElementById('colorTrigger');
const colorDropdown = document.getElementById('colorDropdown');
const colorMenu = document.getElementById('colorMenu');
const colorPlus = document.getElementById('colorPlus');
let penColor = '#7c5cff';

function setPenColor(hex) {
  penColor = hex;
  CanvasModule.setColor(hex);
  if (colorTrigger) colorTrigger.style.setProperty('--c', hex);
  document.querySelectorAll('.color-grid-item[data-color]').forEach((b) => {
    b.classList.toggle('active', b.dataset.color.toLowerCase() === hex.toLowerCase());
  });
}

document.querySelectorAll('.color-grid-item[data-color]').forEach((btn) => {
  btn.addEventListener('click', () => setPenColor(btn.dataset.color));
});

// Плюсик — открываем нашу палитру рядом с меню
if (colorPlus) {
  colorPlus.addEventListener('click', () => {
    if (!Permissions.can('edit')) { Permissions.deny(); return; }
    if (ColorPicker.isOpen()) { ColorPicker.close(); return; }
    colorDropdown.classList.add('pinned'); // меню остаётся на месте, пока открыта палитра
    ColorPicker.open({
      anchor: colorMenu,
      exempt: [colorPlus],
      color: penColor,
      onChange: setPenColor,
      onClose: () => colorDropdown.classList.remove('pinned')
    });
  });
}

// ===== РЕАКЦИИ =====
document.querySelectorAll('.reaction-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!Permissions.can('react')) { Permissions.deny(); return; }
    document.querySelectorAll('.reaction-option').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.remove('active'));
    CanvasModule.setTool(null); // чтобы клик по доске не рисовал, а ставил реакцию
    btn.classList.add('active');
    ReactionsModule.setReaction(btn.dataset.emoji);
    closeDropdowns();
  });
});

// Esc — отменить выбранную реакцию
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') ReactionsModule.clearReaction();
});
