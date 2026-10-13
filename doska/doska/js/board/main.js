// ===== ИМЯ ДОСКИ =====
const boardName = document.getElementById('boardName');
if (boardName) {
  boardName.textContent = Utils.getBoardName();
}

// ===== НАЗАД =====
document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'boards.html';
});

// ===== ПРИГЛАСИТЬ =====
document.getElementById('inviteBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href);
  alert('Ссылка скопирована:\n' + window.location.href);
});

// ===== ОЧИСТИТЬ =====
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Очистить доску?')) return;
  CanvasModule.clear();
  StickersModule.clearAll();
  ImagesModule.clearAll();
  ReactionsModule.clearAll();
});