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
  const link = window.location.href;
  
  navigator.clipboard.writeText(link).then(() => {
    showToast('Ссылка скопирована!');
  }).catch(() => {
    // Если браузер запрещает копировать (например, нет HTTPS), показываем красиво
    showToast('Не удалось скопировать', 'error');
  });
});

// Вспомогательная функция для показа уведомления
function showToast(message, type = 'success') {
  // Удаляем старое, если есть
  const oldToast = document.querySelector('.toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  // Добавляем иконку в зависимости от статуса
  const icon = type === 'success' ? 'check-circle' : 'alert-circle';
  const iconColor = type === 'success' ? '#4ad9a0' : '#ff3b3b';
  
  toast.innerHTML = `<i data-feather="${icon}" style="color: ${iconColor}; width: 20px; height: 20px;"></i> <span>${message}</span>`;
  
  document.body.appendChild(toast);
  if (window.feather) feather.replace();

  // Показываем
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Скрываем через 2.5 секунды
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== ОЧИСТИТЬ =====
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Очистить доску?')) return;
  CanvasModule.clear();
  StickersModule.clearAll();
  ImagesModule.clearAll();
  ReactionsModule.clearAll();
});