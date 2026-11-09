// ===== ПРОФИЛЬ =====
const userNameDisplay = document.getElementById('userNameDisplay');
const userAvatar = document.getElementById('userAvatar');
if (userNameDisplay) {
  const name = Utils.getUserName();
  userNameDisplay.textContent = name;
  userAvatar.textContent = name.charAt(0).toUpperCase();
}

// ===== ДАННЫЕ =====
let boards = JSON.parse(localStorage.getItem('myBoards') || '[]');
if (boards.length === 0) {
  boards = [
    { id: '1', name: 'Мозговой штурм', date: '5 октября 2026' },
    { id: '2', name: 'Планирование проекта', date: '3 октября 2026' },
  ];
}

const grid = document.getElementById('boardsGrid');
const emptyMessage = document.getElementById('emptyMessage');

// ===== ОТРИСОВКА =====
function renderBoards() {
  // Сначала показываем скелетоны (эффект загрузки)
  grid.innerHTML = `
    <div class="skeleton"></div>
    <div class="skeleton"></div>
  `;

  // Имитация задержки загрузки (300мс)
  setTimeout(() => {
    grid.innerHTML = '';

    if (boards.length === 0) {
      emptyMessage.classList.add('show');
      return;
    }
    emptyMessage.classList.remove('show');

    boards.forEach((board) => {
      const card = document.createElement('div');
      card.className = 'board-card';
      card.innerHTML = `
        <div class="board-actions">
          <button class="board-share" title="Поделиться"><i data-feather="link"></i></button>
          <button class="board-delete" title="Удалить"><i data-feather="trash-2"></i></button>
        </div>
        <div class="preview"><i data-feather="clipboard" style="width: 32px; height: 32px;"></i></div>
        <h3>${board.name}</h3>
        <div class="date">${board.date}</div>
      `;

      // Переход
      card.addEventListener('click', (e) => {
        if (e.target.closest('.board-delete') || e.target.closest('.board-share')) return;
        Utils.setBoardName(board.name);
        localStorage.setItem('currentBoardId', board.id);
        window.location.href = 'board.html';
      });

      // Поделиться
      card.querySelector('.board-share').addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const link = `${window.location.origin}/board.html?id=${board.id}`;
        navigator.clipboard.writeText(link).then(() => {
          showToast('Ссылка скопирована!');
        }).catch(() => prompt('Скопируйте ссылку:', link));
      });

          // Кнопка удаления
    card.querySelector('.board-delete').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDeleteModal(board, card); // Вызываем нашу модалку
    });

      grid.appendChild(card);
    });

    if (window.feather) feather.replace();
  }, 300);
}

renderBoards();

// ===== МОДАЛКА СОЗДАНИЯ =====
const modal = document.getElementById('createBoardModal');
const newBoardInput = document.getElementById('newBoardName');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');

document.getElementById('createBtn').addEventListener('click', () => {
  modal.classList.add('show');
  newBoardInput.value = '';
  setTimeout(() => newBoardInput.focus(), 100);
});

cancelCreateBtn.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
confirmCreateBtn.addEventListener('click', createBoard);
newBoardInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') createBoard(); });

function createBoard() {
  const name = newBoardInput.value.trim();
  if (!name) { newBoardInput.style.borderColor = '#ff3b3b'; return; }

  const newBoard = {
    id: Date.now().toString(),
    name: name,
    date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
  };

  boards.push(newBoard);
  localStorage.setItem('myBoards', JSON.stringify(boards));
  
  Utils.setBoardName(newBoard.name);
  localStorage.setItem('currentBoardId', newBoard.id);
  window.location.href = 'board.html';
}

// ===== ВЫХОД =====
document.getElementById('logoutBtn').addEventListener('click', () => {
  Utils.clearUser();
  window.location.href = 'index.html';
});

// ===== УВЕДОМЛЕНИЕ =====
function showToast(message) {
  const oldToast = document.querySelector('.toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i data-feather="check-circle" style="color: #4ad9a0; width: 20px; height: 20px;"></i> <span>${message}</span>`;
  document.body.appendChild(toast);
  
  if (window.feather) feather.replace();

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== МОДАЛКА УДАЛЕНИЯ =====
const deleteModal = document.getElementById('deleteModal');
const deleteModalText = document.getElementById('deleteModalText');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

let boardToDelete = null;
let cardToDelete = null;

function openDeleteModal(board, card) {
  boardToDelete = board;
  cardToDelete = card;
  deleteModalText.textContent = `Вы уверены, что хотите удалить доску "${board.name}"?`;
  deleteModal.classList.add('show');
}

// Отмена
cancelDeleteBtn.addEventListener('click', () => {
  deleteModal.classList.remove('show');
  boardToDelete = null;
  cardToDelete = null;
});

// Клик по темному фону — тоже отмена
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteModal.classList.remove('show');
    boardToDelete = null;
    cardToDelete = null;
  }
});

// Подтверждение удаления
confirmDeleteBtn.addEventListener('click', () => {
  if (!boardToDelete || !cardToDelete) return;

  deleteModal.classList.remove('show');

  // Добавляем класс для анимации
  cardToDelete.classList.add('removing');

  // Ждём 300мс (пока играет анимация), затем удаляем из массива
  setTimeout(() => {
    boards = boards.filter(b => b.id !== boardToDelete.id);
    localStorage.setItem('myBoards', JSON.stringify(boards));
    
    // Перерисовываем
    renderBoards();
    
    boardToDelete = null;
    cardToDelete = null;
  }, 300);
});