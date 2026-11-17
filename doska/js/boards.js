// ===== ПРОФИЛЬ =====
const userNameDisplay = document.getElementById('userNameDisplay');
if (userNameDisplay) {
  const savedName = localStorage.getItem('userName');
  userNameDisplay.textContent = savedName ? savedName : 'Пользователь';
}

// ===== ДАННЫЕ =====
let boards = JSON.parse(localStorage.getItem('myBoards') || '[]');
const grid = document.getElementById('boardsGrid');
const emptyMessage = document.getElementById('emptyMessage');

// ===== ОТРИСОВКА =====
function renderBoards() {
  if (!grid) return;
  grid.innerHTML = '';

  if (boards.length === 0) {
    if (emptyMessage) emptyMessage.classList.add('show');
    if (window.feather) feather.replace();
    return;
  }
  if (emptyMessage) emptyMessage.classList.remove('show');

  boards.forEach((board) => {
    const card = document.createElement('div');
    card.className = 'board-card';
    
    const esc = Utils.escapeHtml;
    card.innerHTML = `
      <div class="board-actions">
        <button class="board-share" title="Поделиться"><i data-feather="link"></i></button>
        <button class="board-delete" title="Удалить"><i data-feather="trash-2"></i></button>
      </div>
      <div class="preview"></div>
      <h3>${esc(board.name)}</h3>
      <div class="date">${esc(board.date)}</div>
    `;

    // Обложка: своя картинка или эмодзи (без вставки пользовательских данных в HTML)
    const preview = card.querySelector('.preview');
    if (board.image) {
      const img = document.createElement('img');
      img.src = board.image;
      img.alt = 'cover';
      preview.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.style.cssText = 'font-size: 48px; z-index: 2;';
      span.textContent = board.emoji || '📋';
      preview.appendChild(span);
    }

    // Переход на доску
    card.addEventListener('click', (e) => {
      if (e.target.closest('.board-delete') || e.target.closest('.board-share')) return;
      Utils.setBoardName(board.name);
      localStorage.setItem('currentBoardId', board.id);
      window.location.href = 'board.html';
    });

    // Кнопка «Поделиться»
    card.querySelector('.board-share').addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const link = `${window.location.origin}/board.html?id=${board.id}`;
      navigator.clipboard.writeText(link).then(() => showToast('Ссылка скопирована!')).catch(() => showToast('Ошибка копирования'));
    });

    // Кнопка удаления
    card.querySelector('.board-delete').addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      openDeleteModal(board, card);
    });

    grid.appendChild(card);
  });

  if (window.feather) feather.replace();
}

renderBoards();

// ===== МОДАЛКА СОЗДАНИЯ =====
const modal = document.getElementById('createBoardModal');
const newBoardInput = document.getElementById('newBoardName');
const coverInput = document.getElementById('coverInput');

let selectedEmoji = '📋';
let selectedImageBase64 = null;

// Выбор эмодзи
document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emoji-btn').forEach(b => {
      b.classList.remove('active');
      b.innerHTML = b.dataset.emoji; // Возвращаем эмодзи, если там была картинка
    });
    
    btn.classList.add('active');
    selectedEmoji = btn.dataset.emoji;
    selectedImageBase64 = null;
  });
});

// Загрузка своей картинки
if (coverInput) {
  coverInput.addEventListener('change', () => {
    const file = coverInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImageBase64 = e.target.result;
      selectedEmoji = null;
      
      // Вместо превью, мы показываем картинку прямо в первой кнопке эмодзи
      const firstBtn = document.querySelector('.emoji-btn');
      if (firstBtn) {
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
        firstBtn.classList.add('active');
        firstBtn.innerHTML = `<img src="${selectedImageBase64}">`;
      }
    };
    reader.readAsDataURL(file);
  });
}

const createBtn = document.getElementById('createBtn');
if (createBtn) {
  createBtn.addEventListener('click', () => {
    if (modal) modal.classList.add('show');
    if (newBoardInput) {
      newBoardInput.value = '';
      newBoardInput.style.borderColor = '';
      setTimeout(() => newBoardInput.focus(), 100);
    }
  });
}

const cancelCreateBtn = document.getElementById('cancelCreateBtn');
if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', () => modal.classList.remove('show'));

if (modal) {
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
}

const confirmCreateBtn = document.getElementById('confirmCreateBtn');
if (confirmCreateBtn) confirmCreateBtn.addEventListener('click', createBoard);

if (newBoardInput) {
  newBoardInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') createBoard(); });
}

function createBoard() {
  if (!newBoardInput) return;
  const name = newBoardInput.value.trim();
  
  if (!name) { 
    newBoardInput.style.borderColor = '#ff3b3b'; 
    return; 
  }

  const newBoard = {
    id: Date.now().toString(),
    name: name,
    emoji: selectedEmoji,
    image: selectedImageBase64,
    date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
  };

  boards.push(newBoard);
  try {
    localStorage.setItem('myBoards', JSON.stringify(boards));
  } catch (err) {
    boards.pop();
    showToast('Не удалось сохранить: картинка слишком большая', 'error');
    return;
  }
  
  Utils.setBoardName(newBoard.name);
  localStorage.setItem('currentBoardId', newBoard.id);
  window.location.href = 'board.html';
}

// ===== МОДАЛКА УДАЛЕНИЯ =====
const deleteModal = document.getElementById('deleteModal');
const deleteModalText = document.getElementById('deleteModalText');
let boardToDelete = null;
let cardToDelete = null;

function openDeleteModal(board, card) {
  boardToDelete = board;
  cardToDelete = card;
  if (deleteModalText) deleteModalText.textContent = `Вы уверены, что хотите удалить доску "${board.name}"?`;
  if (deleteModal) deleteModal.classList.add('show');
}

const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', () => {
    if (deleteModal) deleteModal.classList.remove('show');
  });
}

if (deleteModal) {
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) deleteModal.classList.remove('show');
  });
}

const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', () => {
    if (!boardToDelete || !cardToDelete) return;
    deleteModal.classList.remove('show');
    cardToDelete.classList.add('removing');

    setTimeout(() => {
      boards = boards.filter(b => b.id !== boardToDelete.id);
      localStorage.setItem('myBoards', JSON.stringify(boards));
      renderBoards();
      boardToDelete = null;
      cardToDelete = null;
    }, 300);
  });
}

// ===== ВЫХОД =====
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    Utils.clearUser();
    window.location.href = 'index.html';
  });
}


// ===== УСТАНОВКА КАК ПРИЛОЖЕНИЕ =====
const installBtn = document.getElementById('installBtn');
const installModal = document.getElementById('installModal');

function updateInstallButton() {
  if (!installBtn) return;
  const available = !Utils.isStandalone() && (Utils.canPromptInstall() || Utils.isIOS());
  installBtn.hidden = !available;
}
document.addEventListener('install-available', updateInstallButton);
document.addEventListener('install-done', () => { updateInstallButton(); showToast('Приложение установлено!'); });
updateInstallButton();

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (Utils.canPromptInstall()) await Utils.promptInstall();
    else if (installModal) installModal.classList.add('show');
  });
}
const installOk = document.getElementById('installOkBtn');
if (installOk) installOk.addEventListener('click', () => installModal.classList.remove('show'));
if (installModal) installModal.addEventListener('click', (e) => { if (e.target === installModal) installModal.classList.remove('show'); });
