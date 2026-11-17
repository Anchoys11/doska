const ChatModule = (() => {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '👏', '👎', '😢', '💩', '🤔'];

  // ===== ОТПРАВКА СООБЩЕНИЯ =====
  function send() {
    if (!Permissions.can('chat')) { Permissions.deny(); return; }
    const text = chatInput.value.trim();
    if (!text) return;

    const empty = chatMessages.querySelector('.chat-empty');
    if (empty) empty.remove();

    const msg = document.createElement('div');
    msg.className = 'chat-message chat-message-own';

    const sender = document.createElement('div');
    sender.className = 'chat-sender';
    sender.textContent = localStorage.getItem('userName') || 'Вы';

    const body = document.createElement('div');
    body.className = 'chat-text';
    body.textContent = text;

    // панель реакций (появляется при наведении на сообщение)
    const hover = document.createElement('div');
    hover.className = 'chat-reactions-hover';
    REACTIONS.forEach((emoji) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hover-emoji';
      b.textContent = emoji;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!Permissions.can('react')) { Permissions.deny(); return; }
        Utils.toggleReaction(msg, emoji, 'chat-reactions');
      });
      hover.appendChild(b);
    });

    msg.append(sender, body, hover);
    chatMessages.appendChild(msg);

    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  const chatSend = document.getElementById('chatSend');
  if (chatSend) chatSend.addEventListener('click', send);

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); }
    });
  }

  // ===== СМАЙЛИКИ В ЧАТЕ =====
  const emojiBtn = document.getElementById('chatEmojiBtn');
  const emojiMenu = document.getElementById('chatEmojiMenu');

  if (emojiBtn && emojiMenu) {
    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiMenu.classList.toggle('show');
    });

    document.querySelectorAll('.chat-emoji-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        chatInput.value += item.textContent;
        chatInput.focus();
        emojiMenu.classList.remove('show');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.chat-emoji-picker')) emojiMenu.classList.remove('show');
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
