const ChatModule = (() => {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  function send() {
    const text = chatInput.value.trim();
    if (!text) return;

    const empty = chatMessages.querySelector('.chat-empty');
    if (empty) empty.remove();

    const msg = document.createElement('div');
    msg.className = 'chat-message';
    msg.innerHTML = `<strong>Вы:</strong> ${text}`;
    msg.style.cssText = 'font-size:13px;padding:6px 10px;background:var(--input-bg);border-radius:8px;color:var(--text)';
    chatMessages.appendChild(msg);

    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  document.getElementById('chatSend').addEventListener('click', send);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') send();
  });
  
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