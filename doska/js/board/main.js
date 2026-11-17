const esc = Utils.escapeHtml;
const $ = (id) => document.getElementById(id);
const refreshIcons = () => { if (window.feather) feather.replace(); };

// ===== ИМЯ ДОСКИ =====
const boardName = $('boardName');
if (boardName) {
  boardName.textContent = Utils.getBoardName();

  boardName.addEventListener('blur', () => {
    if (!Permissions.can('rename')) return;
    const newName = boardName.textContent.trim() || 'Без названия';
    boardName.textContent = newName;
    localStorage.setItem('currentBoardName', newName);

    const boards = JSON.parse(localStorage.getItem('myBoards') || '[]');
    const currentId = localStorage.getItem('currentBoardId');
    const idx = boards.findIndex((b) => b.id === currentId);
    if (idx !== -1) {
      boards[idx].name = newName;
      localStorage.setItem('myBoards', JSON.stringify(boards));
    }
  });
  boardName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); boardName.blur(); }
  });
  boardName.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, text);
  });
}

// ===== НАЗАД =====
if ($('backBtn')) $('backBtn').addEventListener('click', () => { window.location.href = 'boards.html'; });

// ===== ПРАВА: что показываем и блокируем для текущей роли =====
const ROLE_ORDER = { owner: 0, admin: 1, editor: 2, viewer: 3 };
const avatarBg = (role) => role === 'owner'
  ? 'linear-gradient(135deg, #ffb84a, #ff8a4a)'
  : role === 'admin'
    ? 'linear-gradient(135deg, #7c5cff, #4a7dff)'
    : 'linear-gradient(135deg, var(--accent), var(--accent-2))';

let lastRole = null;

function renderRolePill() {
  const pill = $('rolePill');
  const role = Permissions.role();
  const info = Permissions.ROLES[role];
  pill.style.setProperty('--rc', info.color);
  pill.innerHTML = `<i data-feather="${info.icon}"></i><span>${info.label}</span>`;
  refreshIcons();
  if (lastRole !== null && lastRole !== role) {
    pill.classList.remove('pop');
    void pill.offsetWidth; // перезапуск анимации
    pill.classList.add('pop');
  }
}

function applyPermissions() {
  const role = Permissions.role();
  const canEdit = Permissions.can('edit');

  Object.keys(Permissions.ROLES).forEach((r) => document.body.classList.remove('role-' + r));
  document.body.classList.add('role-' + role);
  document.body.classList.toggle('readonly', !canEdit);

  document.querySelectorAll('.tool[data-tool]:not([data-tool="hand"])').forEach((b) => b.classList.toggle('locked', !canEdit));
  document.querySelectorAll('.toolbar .dropdown').forEach((d) => d.classList.toggle('locked', !canEdit));
  $('clearBtn').classList.toggle('locked', !Permissions.can('clear'));

  const chatInput = $('chatInput');
  const chatSend = $('chatSend');
  if (chatInput) {
    chatInput.disabled = !Permissions.can('chat');
    chatInput.placeholder = Permissions.can('chat') ? 'Написать...' : 'Только чтение';
  }
  if (chatSend) chatSend.disabled = !Permissions.can('chat');

  if (boardName) boardName.contentEditable = Permissions.can('rename') ? 'true' : 'false';

  if (!canEdit) {
    // снимаем всё, кроме «руки»
    document.querySelectorAll('.tool[data-tool]:not([data-tool="hand"])').forEach((b) => b.classList.remove('active'));
    if (CanvasModule.getTool() !== 'hand') CanvasModule.setTool(null);
    ReactionsModule.clearReaction();
    ColorPicker.close();
  }
  StickersModule.refreshEditable();

  renderRolePill();
  lastRole = role;

  // плашка режима «посмотреть как…»
  const banner = $('previewBanner');
  if (Permissions.isPreview()) {
    $('previewText').textContent = 'Вы смотрите доску как: ' + Permissions.ROLES[role].label;
    refreshIcons();
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

// ===== КТО В СЕТИ (в шапке) =====
let presenceSig = '';
let knownOnline = new Set();

function renderPresence() {
  const online = Permissions.getMembers().filter((m) => Permissions.isOnline(m.name));
  const sig = online.map((m) => m.id + m.role).join('|');
  if (sig === presenceSig) return;
  presenceSig = sig;

  const names = new Set(online.map((m) => m.id));
  const shown = online.slice(0, 4);
  const extra = online.length - shown.length;

  $('presence').innerHTML = `
    <div class="presence-stack">
      ${shown.map((m, i) => `
        <div class="presence-avatar ${knownOnline.has(m.id) ? '' : 'enter'}" style="background:${avatarBg(m.role)};z-index:${10 - i}"
             title="${esc(m.name)}${m.name === Permissions.me ? ' (Вы)' : ''}">
          ${esc(m.name.charAt(0).toUpperCase())}<i class="status-dot online"></i>
        </div>`).join('')}
      ${extra > 0 ? `<div class="presence-avatar more">+${extra}</div>` : ''}
    </div>
    <span class="presence-text"><i class="lamp"></i>${online.length} в сети</span>`;
  knownOnline = names;
}

$('presence').addEventListener('click', () => $('membersBtn').click());

// ===== УЧАСТНИКИ =====
const membersModal = $('membersModal');
const membersList = $('membersList');

function statusText(name) {
  return Permissions.isOnline(name) ? 'В сети' : Permissions.ago(Permissions.lastSeen(name));
}

function renderMembersList(animate, flashId) {
  const list = Permissions.getMembers().sort((a, b) =>
    ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name, 'ru'));
  const assignable = Permissions.assignableRoles();

  membersList.innerHTML = list.map((m, i) => {
    const info = Permissions.ROLES[m.role];
    const isMe = m.name === Permissions.me;
    const online = Permissions.isOnline(m.name);
    const manageable = Permissions.canManageMember(m);

    const roleHTML = manageable
      ? `<div class="role-selector-wrapper">
           <select class="member-role-select" data-id="${esc(m.id)}">
             ${assignable.map((r) => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${Permissions.ROLES[r].label}</option>`).join('')}
           </select>
           <i data-feather="chevron-down" class="select-icon"></i>
         </div>`
      : `<div class="role-badge" style="color:${info.color};background:${info.color}18;border:1px solid ${info.color}33;">
           <i data-feather="${info.icon}"></i> ${info.label}
         </div>`;

    const removeHTML = manageable
      ? `<button type="button" class="member-remove" data-id="${esc(m.id)}" title="Убрать с доски"><i data-feather="x"></i></button>`
      : '';

    return `
      <div class="member-item ${animate ? 'enter' : ''} ${m.id === flashId ? 'flash' : ''}" data-id="${esc(m.id)}" data-name="${esc(m.name)}" style="--i:${i}">
        <div class="member-info">
          <div class="member-avatar" style="background:${avatarBg(m.role)};">
            ${esc(m.name.charAt(0).toUpperCase())}
            <span class="status-dot ${online ? 'online' : 'offline'}"></span>
          </div>
          <div>
            <div class="member-name">${esc(m.name)} ${isMe ? '<span class="me-mark">(Вы)</span>' : ''}</div>
            <div class="member-status-text ${online ? 'is-online' : ''}">${esc(statusText(m.name))}</div>
          </div>
        </div>
        <div class="member-controls">${roleHTML}${removeHTML}</div>
      </div>`;
  }).join('');

  const online = list.filter((m) => Permissions.isOnline(m.name)).length;
  $('membersSub').textContent = `${list.length} ${list.length === 1 ? 'участник' : 'участников'} · ${online} в сети`;
  refreshIcons();

  membersList.querySelectorAll('.member-role-select').forEach((select) => {
    select.addEventListener('change', () => {
      const id = select.dataset.id;
      if (Permissions.setRole(id, select.value)) {
        renderMembersList(false, id);
        showToast('Роль обновлена');
      } else {
        Permissions.deny();
        renderMembersList(false);
      }
    });
  });

  membersList.querySelectorAll('.member-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.member-item');
      row.classList.add('leaving');
      setTimeout(() => {
        if (Permissions.removeMember(btn.dataset.id)) showToast('Участник убран с доски');
      }, 260);
    });
  });
}

// обновляем статусы без перерисовки (чтобы не запускать анимации заново)
function updateMembersPresence() {
  let online = 0;
  membersList.querySelectorAll('.member-item').forEach((row) => {
    const name = row.dataset.name;
    const isOn = Permissions.isOnline(name);
    if (isOn) online++;
    const dot = row.querySelector('.status-dot');
    dot.classList.toggle('online', isOn);
    dot.classList.toggle('offline', !isOn);
    const text = row.querySelector('.member-status-text');
    text.classList.toggle('is-online', isOn);
    const t = statusText(name);
    if (text.textContent !== t) text.textContent = t;
  });
  const total = membersList.querySelectorAll('.member-item').length;
  $('membersSub').textContent = `${total} ${total === 1 ? 'участник' : 'участников'} · ${online} в сети`;
}

function renderPreviewSwitch() {
  const box = $('previewSwitch');
  const real = Permissions.realRole();
  if (real !== 'owner' && real !== 'admin') { box.style.display = 'none'; return; }
  const roles = real === 'owner' ? ['admin', 'editor', 'viewer'] : ['editor', 'viewer'];
  box.style.display = '';
  box.innerHTML = `
    <div class="preview-label">Проверить доску глазами роли</div>
    <div class="preview-chips">
      ${roles.map((r) => {
        const info = Permissions.ROLES[r];
        return `<button type="button" class="preview-chip ${Permissions.getPreview() === r ? 'active' : ''}" data-role="${r}" style="--rc:${info.color}">
                  <i data-feather="${info.icon}"></i>${info.label}</button>`;
      }).join('')}
    </div>`;
  refreshIcons();
  box.querySelectorAll('.preview-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      Permissions.setPreview(chip.dataset.role);
      membersModal.classList.remove('show');
    });
  });
}

function renderLegend() {
  $('rolesLegendBody').innerHTML = Object.keys(Permissions.ROLES).map((r) => {
    const info = Permissions.ROLES[r];
    return `<div class="legend-row">
      <span class="legend-icon" style="color:${info.color};background:${info.color}18"><i data-feather="${info.icon}"></i></span>
      <div><b>${info.label}</b><div>${esc(info.desc)}</div></div>
    </div>`;
  }).join('');
  refreshIcons();
}
renderLegend();

$('membersBtn').addEventListener('click', () => {
  renderMembersList(true);
  renderPreviewSwitch();
  membersModal.classList.add('show');
});
$('closeMembersBtn').addEventListener('click', () => membersModal.classList.remove('show'));
membersModal.addEventListener('click', (e) => { if (e.target === membersModal) membersModal.classList.remove('show'); });

// ===== ПРИГЛАСИТЬ =====
const inviteModal = $('inviteModal');

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => showToast('Ссылка скопирована!'))
    .catch(() => showToast('Не удалось скопировать', 'error'));
}

$('inviteBtn').addEventListener('click', () => {
  if (!Permissions.can('manage')) { copyLink(); return; }
  const roles = Permissions.assignableRoles();
  $('inviteRole').innerHTML = roles.map((r) => `<option value="${r}" ${r === 'editor' ? 'selected' : ''}>${Permissions.ROLES[r].label}</option>`).join('');
  $('inviteName').value = '';
  inviteModal.classList.add('show');
  setTimeout(() => $('inviteName').focus(), 50);
});
$('inviteCopyBtn').addEventListener('click', copyLink);
inviteModal.addEventListener('click', (e) => { if (e.target === inviteModal) inviteModal.classList.remove('show'); });

function addInvited() {
  const result = Permissions.addMember($('inviteName').value, $('inviteRole').value);
  if (result === 'ok') { inviteModal.classList.remove('show'); showToast('Участник добавлен'); }
  else if (result === 'exists') showToast('Участник с таким именем уже есть', 'error');
  else if (result === 'empty') showToast('Введите имя', 'error');
  else Permissions.deny();
}
$('inviteAddBtn').addEventListener('click', addInvited);
$('inviteName').addEventListener('keydown', (e) => { if (e.key === 'Enter') addInvited(); });

// ===== РЕЖИМ «ПОСМОТРЕТЬ КАК…» =====
$('previewExit').addEventListener('click', () => Permissions.setPreview(null));

// ===== ОЧИСТИТЬ =====
const clearModal = $('clearModal');
$('clearBtn').addEventListener('click', () => {
  if (!Permissions.can('clear')) { Permissions.deny(); return; }
  clearModal.classList.add('show');
});
$('cancelClearBtn').addEventListener('click', () => clearModal.classList.remove('show'));
clearModal.addEventListener('click', (e) => { if (e.target === clearModal) clearModal.classList.remove('show'); });
$('confirmClearBtn').addEventListener('click', () => {
  if (!Permissions.can('clear')) { Permissions.deny(); return; }
  CanvasModule.clear();
  StickersModule.clearAll();
  ImagesModule.clearAll();
  FilesModule.clearAll();
  ReactionsModule.clearAll();
  clearModal.classList.remove('show');
  showToast('Доска очищена');
});

// ===== РЕАКЦИЯ НА ИЗМЕНЕНИЯ ПРАВ И СТАТУСОВ =====
Permissions.onChange((type, extra) => {
  if (type === 'presence') {
    renderPresence();
    if (membersModal.classList.contains('show')) updateMembersPresence();
    return;
  }
  const before = lastRole;
  applyPermissions();
  renderPresence();
  if (membersModal.classList.contains('show')) {
    renderMembersList(false, extra && extra.id);
    renderPreviewSwitch();
  }
  if (extra && extra.external && before !== Permissions.role()) {
    showToast('Ваша роль изменена: ' + Permissions.ROLES[Permissions.role()].label);
  }
});

applyPermissions();
renderPresence();
