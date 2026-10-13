// ===== EMAIL =====
const userEmail = document.getElementById('userEmail');
if (userEmail) {
  userEmail.textContent = Utils.getUserEmail();
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
    <button class="board-delete" title="Удалить">🗑️</button>
    <div class="preview">📋</div>
    <h3>${board.name}</h3>
    <div class="date">${board.date}</div>
  `;
  
  card.addEventListener('click', (e) => {
    if (e.target.closest('.board-delete')) return;
    Utils.setBoardName(board.name);
    window.location.href = 'board.html';
  });

  // Кнопка удаления
  card.querySelector('.board-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!confirm(`Удалить доску "${board.name}"?`)) return;
    
    boards = boards.filter(b => b.id !== board.id);
    localStorage.setItem('myBoards', JSON.stringify(boards));
    renderBoards();
  });

  grid.appendChild(card);
});
}

renderBoards();

// ===== СОЗДАНИЕ =====
document.getElementById('createBtn').addEventListener('click', () => {
  const name = prompt('Название доски:', 'Новая доска');
  if (!name) return;

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
  renderBoards();
});

// ===== ВЫХОД =====
document.getElementById('logoutBtn').addEventListener('click', () => {
  Utils.clearUser();
  window.location.href = 'index.html';
});