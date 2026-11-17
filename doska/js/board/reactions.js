const ReactionsModule = (() => {
  const wrapper = CanvasModule.objectsLayer;
  const canvas = CanvasModule.canvas;
  let currentReaction = null;

  // Всплывающий эмодзи на пустом месте доски
  function create(x, y, emoji) {
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    wrapper.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }

  function clearAll() {
    wrapper.querySelectorAll('.floating-emoji').forEach((el) => el.remove());
  }

  function setReaction(emoji) {
    currentReaction = emoji;
    document.body.classList.add('reacting');
    const trigger = document.getElementById('reactionTrigger');
    if (trigger) { trigger.dataset.emoji = emoji; trigger.classList.add('armed'); }
  }

  function clearReaction() {
    currentReaction = null;
    document.body.classList.remove('reacting');
    document.querySelectorAll('.reaction-option').forEach((b) => b.classList.remove('active'));
    const trigger = document.getElementById('reactionTrigger');
    if (trigger) { trigger.classList.remove('armed'); delete trigger.dataset.emoji; }
  }

  const HOSTS = '.sticker, .board-image, .board-file';
  const INNER = '.sticker-panel, .sticker-resize, .image-resize, .image-delete, .file-actions, .object-reactions';

  document.addEventListener('click', (e) => {
    if (!currentReaction) return;
    if (!Permissions.can('react')) { clearReaction(); return; }
    if (e.target.closest('.toolbar, .chat, .header, .modal-overlay, .cp-pop')) return;

    // Клик по заметке, картинке или файлу — ставим реакцию
    const host = e.target.closest(HOSTS);
    if (host && !e.target.closest(INNER)) {
      Utils.toggleReaction(host, currentReaction);
      clearReaction();
      return;
    }

    // Клик по пустому холсту — всплывающий эмодзи
    if (e.target === canvas) {
      const pos = CanvasModule.getMousePos(e);
      create(pos.x, pos.y, currentReaction);
      clearReaction();
    }
  });

  return { create, clearAll, setReaction, getReaction: () => currentReaction, clearReaction };
})();
