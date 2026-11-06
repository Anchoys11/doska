// ===== ИМЯ ДОСКИ =====
const boardName = document.getElementById('boardName');
if (boardName) {
  boardName.textContent = Utils.getBoardName();
}

// Сохранение названия при потере фокуса
boardName.addEventListener('blur', () => {
  const newName = boardName.textContent.trim() || 'Без названия';
  boardName.textContent = newName;
  
  // Обновляем в localStorage
  localStorage.setItem('currentBoardName', newName);
  
  // Обновляем в списке досок (если нужно)
  const boards = JSON.parse(localStorage.getItem('myBoards') || '[]');
  const currentId = localStorage.getItem('currentBoardId');
  const boardIndex = boards.findIndex(b => b.id === currentId);
  
  if (boardIndex !== -1) {
    boards[boardIndex].name = newName;
    localStorage.setItem('myBoards', JSON.stringify(boards));
  }
});

// Запрещаем перенос строки по Enter
boardName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    boardName.blur();
  }
});

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