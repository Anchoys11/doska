// ===== ТЕМА =====
(function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', next);
  });
})();

// ===== УТИЛИТЫ =====
const Utils = {
  // Получить email пользователя
  getUserEmail() {
    return localStorage.getItem('userEmail') || 'user@mail.com';
  },

  // Сохранить email
  setUserEmail(email) {
    localStorage.setItem('userEmail', email);
  },

  // Очистить данные
  clearUser() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentBoardName');
  },

  // Получить имя текущей доски
  getBoardName() {
    return localStorage.getItem('currentBoardName') || 'Моя доска';
  },

  // Сохранить имя доски
  setBoardName(name) {
    localStorage.setItem('currentBoardName', name);
  },
};