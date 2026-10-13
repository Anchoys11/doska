const ReactionsModule = (() => {
  const wrapper = CanvasModule.wrapper;
  const canvas = CanvasModule.canvas;
  let currentReaction = null;

  // ===== СОЗДАНИЕ ВСПЛЫВАЮЩЕГО ЭМОДЗИ =====
  function create(x, y, emoji) {
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    wrapper.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  // ===== ОЧИСТКА =====
  function clearAll() {
    wrapper.querySelectorAll('.floating-emoji').forEach(el => el.remove());
  }

  // ===== КЛИК ПО ДОКУМЕНТУ =====
  document.addEventListener('click', (e) => {
    if (!currentReaction) return;

    // Игнорируем панель, чат, шапку
    if (e.target.closest('.toolbar')) return;
    if (e.target.closest('.chat')) return;
    if (e.target.closest('.header')) return;

    // Клик по заметке
    const sticker = e.target.closest('.sticker');
    if (sticker && !e.target.closest('.sticker-panel') && !e.target.closest('.color-menu') && !e.target.closest('.sticker-reactions') && !e.target.closest('.sticker-resize')) {
      if (typeof StickersModule !== 'undefined' && StickersModule.attachReaction) {
        StickersModule.attachReaction(sticker, currentReaction);
      }
      return;
    }

    // Клик по картинке
    const image = e.target.closest('.board-image');
    if (image && !e.target.closest('.image-resize') && !e.target.closest('.image-delete') && !e.target.closest('.image-reactions')) {
      if (typeof ImagesModule !== 'undefined' && ImagesModule.attachReaction) {
        ImagesModule.attachReaction(image, currentReaction);
      }
      return;
    }

    // Клик по холсту — всплывающий эмодзи
    if (e.target === canvas) {
      const rect = canvas.getBoundingClientRect();
      create(e.clientX - rect.left, e.clientY - rect.top, currentReaction);
    }
  });

  return {
    create,
    clearAll,
    setReaction: (emoji) => { currentReaction = emoji; },
    getReaction: () => currentReaction,
    clearReaction: () => { currentReaction = null; },
  };
})();