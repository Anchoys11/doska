// ===== ПЕРЕКЛЮЧЕНИЕ ФОРМ =====
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const subtitle = document.getElementById('subtitle');
const linkText = document.getElementById('linkText');
const switchLink = document.getElementById('switchLink');

let isLogin = false;

if (switchLink) {
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
}

// ===== РЕГИСТРАЦИЯ =====
if (registerForm) {
  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameField = document.getElementById('regName');
    const emailField = document.getElementById('regEmail');
    const passField = document.getElementById('regPassword');
    const pass2Field = document.getElementById('regPassword2');

    if (!nameField || !emailField || !passField || !pass2Field) {
      showToast('Ошибка: какие-то поля не найдены', 'error');
      return;
    }

    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const password = passField.value;
    const password2 = pass2Field.value;

    if (!name) {
      showToast('Пожалуйста, введите имя', 'error');
      return;
    }
    if (password !== password2) {
      showToast('Пароли не совпадают', 'error');
      return;
    }

    // СОХРАНЯЕМ ИМЯ
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);

    window.location.href = 'boards.html';
  });
}

// ===== ВХОД =====
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('logEmail').value.trim();
    const password = document.getElementById('logPassword').value;

    if (!email || !password) return;

    if (!localStorage.getItem('userName')) {
      localStorage.setItem('userName', 'Пользователь');
    }
    localStorage.setItem('userEmail', email);
    window.location.href = 'boards.html';
  });
}