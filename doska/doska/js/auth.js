// ===== ПЕРЕКЛЮЧЕНИЕ ФОРМ =====
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const subtitle = document.getElementById('subtitle');
const linkText = document.getElementById('linkText');
const switchLink = document.getElementById('switchLink');

let isLogin = false;

switchLink.addEventListener('click', (e) => {
  e.preventDefault();
  isLogin = !isLogin;

  if (isLogin) {
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
    subtitle.textContent = 'Войдите в аккаунт';
    linkText.textContent = 'Нет аккаунта?';
    switchLink.textContent = 'Зарегистрироваться';
  } else {
    registerForm.style.display = 'flex';
    loginForm.style.display = 'none';
    subtitle.textContent = 'Создайте аккаунт';
    linkText.textContent = 'Уже есть аккаунт?';
    switchLink.textContent = 'Войти';
  }
});

// ===== РЕГИСТРАЦИЯ =====
registerForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const password2 = document.getElementById('regPassword2').value;

  if (password !== password2) {
    alert('Пароли не совпадают');
    return;
  }

  if (password.length < 6) {
    alert('Пароль должен быть не короче 6 символов');
    return;
  }

  Utils.setUserEmail(email);
  window.location.href = 'boards.html';
});

// ===== ВХОД =====
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('logEmail').value.trim();
  const password = document.getElementById('logPassword').value;

  if (!email || !password) return;

  Utils.setUserEmail(email);
  window.location.href = 'boards.html';
});