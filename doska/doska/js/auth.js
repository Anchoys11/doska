// ===== РЕГИСТРАЦИЯ =====
const form = document.getElementById('registerForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const password2Input = document.getElementById('password2');

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const password2 = password2Input.value;

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
}