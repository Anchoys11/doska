// ===== ИНСТРУМЕНТЫ =====
document.querySelectorAll('.tool[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.reaction-option').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    CanvasModule.setTool(btn.dataset.tool);
    ReactionsModule.clearReaction();
    document.body.classList.remove('reacting');
    document.getElementById('reactionTrigger').textContent = '😊';
  });
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
document.querySelectorAll('.color-grid-item:not(.plus)').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById('colorTrigger').style.background = btn.dataset.color;
    CanvasModule.setColor(btn.dataset.color);
  });
});

// Плюсик — свой цвет
const colorPlus = document.getElementById('colorPlus');
if (colorPlus) {
  colorPlus.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'color';
    inp.value = '#7c5cff';
    inp.addEventListener('input', () => {
      document.getElementById('colorTrigger').style.background = inp.value;
      CanvasModule.setColor(inp.value);
    });
    inp.click();
  });
}

// ===== РЕАКЦИИ =====
document.querySelectorAll('.reaction-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.reaction-option').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    ReactionsModule.setReaction(btn.dataset.emoji);
    document.getElementById('reactionTrigger').textContent = btn.dataset.emoji;
    document.body.classList.add('reacting');
  });
});