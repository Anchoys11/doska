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

// Если пусто — две фейковые для примера
if (boards.length === 0) {
  boards = [
    { id: '1', name: 'Мозговой штурм', date: '5 октября 2026' },
    { id: '2', name: 'Планирование проекта', date: '3 октября 2026' },
  ];
}

// ===== ОТРИСОВКА =====
const grid = document.getElementById('boardsGrid');
const emptyMessage = document.getElementById('emptyMessage');

function renderBoards() {
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

    // Клик по карточке — переход на доску
    card.addEventListener('click', (e) => {
      if (e.target.closest('.board-delete')) return;
      if (e.target.closest('.board-share')) return;
      if (e.target.closest('.board-actions')) return;

      Utils.setBoardName(board.name);
      localStorage.setItem('currentBoardId', board.id);
      window.location.href = 'board.html';
    });

    // Кнопка «Поделиться»
    card.querySelector('.board-share').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const link = `${window.location.origin}/board.html?id=${board.id}`;

      navigator.clipboard.writeText(link).then(() => {
        showToast('Ссылка скопирована!');
      }).catch(() => {
        prompt('Скопируйте ссылку:', link);
      });
    });

    // Кнопка удаления
    card.querySelector('.board-delete').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!confirm(`Удалить доску "${board.name}"?`)) return;

      boards = boards.filter(b => b.id !== board.id);
      localStorage.setItem('myBoards', JSON.stringify(boards));
      renderBoards();
    });

    grid.appendChild(card);
  });

  // Отрисовка иконок (ОБЯЗАТЕЛЬНО В КОНЦЕ ЦИКЛА)
  if (window.feather) {
    feather.replace();
  }
}

renderBoards();

// ===== МОДАЛКА СОЗДАНИЯ =====
const modal = document.getElementById('createBoardModal');
const newBoardInput = document.getElementById('newBoardName');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');

// Открываем при клике на "Создать"
document.getElementById('createBtn').addEventListener('click', () => {
  modal.classList.add('show');
  newBoardInput.value = ''; // Очищаем поле
  setTimeout(() => newBoardInput.focus(), 100); // Фокус на поле
});

// Закрываем
cancelCreateBtn.addEventListener('click', () => {
  modal.classList.remove('show');
});

// Закрываем при клике на темный фон
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('show');
});

// Создание по кнопке "Создать"
confirmCreateBtn.addEventListener('click', createBoard);

// Создание по нажатию Enter в инпуте
newBoardInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') createBoard();
});

function createBoard() {
  const name = newBoardInput.value.trim();
  if (!name) {
    newBoardInput.style.borderColor = '#ff3b3b'; // Красная рамка
    return;
  }

  const newBoard = {
    id: Date.now().toString(),
    name: name,
    date: new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };

  boards.push(newBoard);
  localStorage.setItem('myBoards', JSON.stringify(boards));
  
  // Сохраняем данные для перехода
  Utils.setBoardName(newBoard.name);
  localStorage.setItem('currentBoardId', newBoard.id);

  // Переходим на доску!
  window.location.href = 'board.html';
}

// ===== ВЫХОД =====
document.getElementById('logoutBtn').addEventListener('click', () => {
  Utils.clearUser();
  window.location.href = 'index.html';
});

// ===== ВСПЛЫВАЮЩЕЕ УВЕДОМЛЕНИЕ =====
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}