// ===== ТЕМА =====
(function initTheme() {
  const html = document.documentElement;
  const saved = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', saved);

  const THEME_COLORS = { light: '#f5f6fa', dark: '#0f0f1a' };
  const paintBar = (theme) => {
    const meta = document.getElementById('themeColor');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.light);
  };
  paintBar(saved);

  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const render = (theme) => {
    paintBar(theme);
    themeToggle.innerHTML = theme === 'dark' ? '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
    if (window.feather) feather.replace();
  };
  render(saved);

  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    render(next);
  });
})();

// ===== УТИЛИТЫ =====
const COMPACT_QUERY = '(max-width: 768px), (pointer: coarse) and (max-height: 500px)';
const Utils = {
  // телефон (в том числе в горизонтальном положении)
  isCompact() { return window.matchMedia(COMPACT_QUERY).matches; },
  isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; },
  isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },

  getUserEmail() { return localStorage.getItem('userEmail') || 'user@mail.com'; },
  setUserEmail(email) { localStorage.setItem('userEmail', email); },
  getUserName() { return localStorage.getItem('userName') || 'Пользователь'; },

  clearUser() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('currentBoardName');
  },

  getBoardName() { return localStorage.getItem('currentBoardName') || 'Моя доска'; },
  setBoardName(name) { localStorage.setItem('currentBoardName', name); },

  // Защита от внедрения HTML (имена, сообщения, названия файлов)
  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  // Реакция на объекте / сообщении: одна реакция от пользователя, повторный клик снимает её
  toggleReaction(host, emoji, barClass = 'object-reactions') {
    let bar = Array.from(host.children).find((c) => c.classList.contains(barClass));
    if (!bar) {
      bar = document.createElement('div');
      bar.className = barClass;
      host.appendChild(bar);
    }

    const paint = (chip) => {
      const count = parseInt(chip.dataset.count, 10);
      if (count <= 0) { chip.remove(); return; }
      chip.textContent = chip.dataset.emoji + ' ';
      const s = document.createElement('span');
      s.textContent = count;
      chip.appendChild(s);
    };

    const mine = Array.from(bar.children).find((c) => c.classList.contains('active-user'));
    const same = mine && mine.dataset.emoji === emoji;

    if (mine) {
      mine.classList.remove('active-user');
      mine.dataset.count = parseInt(mine.dataset.count, 10) - 1;
      paint(mine);
    }

    if (!same) {
      let chip = Array.from(bar.children).find((c) => c.dataset.emoji === emoji);
      if (!chip) {
        chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'reaction-chip';
        chip.dataset.emoji = emoji;
        chip.dataset.count = '0';
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          Utils.toggleReaction(host, chip.dataset.emoji, barClass);
        });
        bar.appendChild(chip);
      }
      chip.classList.add('active-user');
      chip.dataset.count = parseInt(chip.dataset.count, 10) + 1;
      paint(chip);
    }

    if (!bar.children.length) bar.remove();
  }
};

// ===== УВЕДОМЛЕНИЕ (TOAST) =====
function showToast(message, type = 'success') {
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';

  const icon = type === 'success' ? 'check-circle' : 'alert-circle';
  const color = type === 'success' ? '#4ad9a0' : '#ff3b3b';
  toast.innerHTML = `<i data-feather="${icon}" style="color:${color};width:20px;height:20px"></i><span>${Utils.escapeHtml(message)}</span>`;

  document.body.appendChild(toast);
  if (window.feather) feather.replace();

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== Esc закрывает модальные окна =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show'));
  }
});


// ===== ПРИЛОЖЕНИЕ (PWA): работа без интернета и установка =====
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* не критично */ });
  });
}

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.dispatchEvent(new CustomEvent('install-available'));
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  document.dispatchEvent(new CustomEvent('install-done'));
});
Utils.canPromptInstall = () => !!deferredInstallPrompt;
Utils.promptInstall = async () => {
  if (!deferredInstallPrompt) return false;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return choice.outcome === 'accepted';
};
