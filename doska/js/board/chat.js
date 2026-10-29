const ChatModule = (() => {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  // ===== ОТПРАВКА СООБЩЕНИЯ =====
  function send() {
    const text = chatInput.value.trim();
    if (!text) return;

    const empty = chatMessages.querySelector('.chat-empty');
    if (empty) empty.remove();

    // Создаем сообщение
    const msg = document.createElement('div');
    msg.className = 'chat-message chat-message-own';
    
    // Вставляем текст и кнопку реакции
    msg.innerHTML = `
      <div class="chat-text">${text}</div>
      <div class="chat-react-btn" title="Поставить реакцию">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
      </div>
    `;
    
    chatMessages.appendChild(msg);

    // ===== ОБРАБОТЧИК РЕАКЦИИ ДЛЯ ЭТОГО СООБЩЕНИЯ =====
  msg.querySelector('.chat-react-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.querySelectorAll('.chat-emoji-popup').forEach(el => el.remove());

  const popup = document.createElement('div');
  popup.className = 'chat-emoji-popup';
  popup.innerHTML = `
    <button class="popup-emoji">👍</button>
    <button class="popup-emoji">❤️</button>
    <button class="popup-emoji">😂</button>
    <button class="popup-emoji">🔥</button>
  `;
  
  const rect = e.target.closest('.chat-react-btn').getBoundingClientRect();
  popup.style.top = (rect.top - 40) + 'px';
  popup.style.left = (rect.left - 60) + 'px';
  document.body.appendChild(popup);

  // ВАЖНО: остановить клик внутри меню, чтобы document не закрыл его
  popup.addEventListener('click', (ev) => ev.stopPropagation());

  popup.querySelectorAll('.popup-emoji').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.textContent;
      let rBar = msg.querySelector('.chat-reactions');
      if (!rBar) {
        rBar = document.createElement('div');
        rBar.className = 'chat-reactions';
        msg.appendChild(rBar);
      }
      let existing = rBar.querySelector(`[data-emoji="${emoji}"]`);
      if (existing) {
        existing.dataset.count = parseInt(existing.dataset.count) + 1;
        existing.innerHTML = `${emoji} <span>${existing.dataset.count}</span>`;
      } else {
        const chip = document.createElement('span');
        chip.className = 'reaction-chip';
        chip.dataset.emoji = emoji;
        chip.dataset.count = 1;
        chip.innerHTML = `${emoji} <span>1</span>`;
        rBar.appendChild(chip);
      }
      popup.remove();
    });
  });

  setTimeout(() => {
    document.addEventListener('click', function closePopup() {
      popup.remove();
      document.removeEventListener('click', closePopup);
    });
  }, 10);
});

    // Очистка
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  document.getElementById('chatSend').addEventListener('click', send);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') send();
  });

  // ===== ЭМОДЗИ В ЧАТЕ =====
  const emojiBtn = document.getElementById('chatEmojiBtn');
  const emojiMenu = document.getElementById('chatEmojiMenu');

  if (emojiBtn && emojiMenu) {
    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiMenu.classList.toggle('show');
    });

    // Клик по эмодзи — вставляем в input
    document.querySelectorAll('.chat-emoji-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        chatInput.value += item.textContent;
        chatInput.focus();
        emojiMenu.classList.remove('show');
      });
    });

    // Клик вне меню — закрываем
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.chat-emoji-picker')) {
        emojiMenu.classList.remove('show');
      }
    });
  }

  // ===== СВОРАЧИВАНИЕ ЧАТА =====
  const chatPanel = document.getElementById('chatPanel');
  const chatToggle = document.getElementById('chatToggle');
  const chatOpen = document.getElementById('chatOpen');

  if (chatToggle && chatOpen) {
    chatToggle.addEventListener('click', () => {
      chatPanel.classList.add('collapsed');
      chatOpen.classList.add('visible');
    });

    chatOpen.addEventListener('click', () => {
      chatPanel.classList.remove('collapsed');
      chatOpen.classList.remove('visible');
    });
  }
})();