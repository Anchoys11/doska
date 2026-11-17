// Роли, права и «кто в сети» — всё хранится в браузере (без сервера).
// Работает между вкладками одного браузера через localStorage.
const Permissions = (() => {
  const boardId = localStorage.getItem('currentBoardId') || 'default';
  const MEMBERS_KEY = 'boardMembers:' + boardId;
  const PRESENCE_KEY = 'boardPresence:' + boardId;
  const PREVIEW_KEY = 'previewRole:' + boardId;
  const ONLINE_MS = 12000;     // считаем «в сети», если сигнал был не позже 12 секунд назад
  const BEAT_MS = 4000;        // как часто подаём сигнал

  const me = localStorage.getItem('userName') || 'Пользователь';

  const ROLES = {
    owner:  { label: 'Владелец', icon: 'star',   color: '#ffb84a', desc: 'Полный доступ ко всему' },
    admin:  { label: 'Админ',    icon: 'shield', color: '#7c5cff', desc: 'Управляет участниками, очищает доску, всё редактирует' },
    editor: { label: 'Редактор', icon: 'edit-3', color: '#4ad9a0', desc: 'Рисует, добавляет и двигает объекты, ставит реакции, пишет в чат' },
    viewer: { label: 'Читатель', icon: 'eye',    color: '#8a8aa0', desc: 'Только смотрит: ничего менять, добавлять и писать нельзя' }
  };

  const CAPS = {
    owner:  ['edit', 'react', 'chat', 'clear', 'manage', 'rename'],
    admin:  ['edit', 'react', 'chat', 'clear', 'manage', 'rename'],
    editor: ['edit', 'react', 'chat'],
    viewer: []
  };

  const listeners = [];
  let members = load();
  let preview = null;
  try { preview = sessionStorage.getItem(PREVIEW_KEY); } catch (e) { /* нет доступа */ }

  function load() {
    try {
      const list = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
      return Array.isArray(list) ? list.filter((m) => m && m.name && ROLES[m.role]) : [];
    } catch (e) { return []; }
  }

  function save() {
    try { localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)); } catch (e) { /* переполнено */ }
  }

  function emit(type, extra) { listeners.forEach((cb) => cb(type, extra)); }

  // Создатель доски — владелец (он всегда один). Новый человек становится редактором.
  function ensureMe() {
    if (!localStorage.getItem('userEmail')) return; // не вошли в аккаунт — страница сейчас перенаправит на вход
    if (members.some((m) => m.name === me)) return;
    const hasOwner = members.some((m) => m.role === 'owner');
    members.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: me, role: hasOwner ? 'editor' : 'owner' });
    save();
  }
  ensureMe();

  const getMember = (name) => members.find((m) => m.name === name);
  const realRole = () => (getMember(me) || {}).role || 'viewer';
  const role = () => (preview && ROLES[preview] && preview !== 'owner') ? preview : realRole();
  const can = (action) => CAPS[role()].includes(action);

  // Кого и на какие роли может менять текущий пользователь
  function assignableRoles() {
    const r = role();
    if (r === 'owner') return ['admin', 'editor', 'viewer'];
    if (r === 'admin') return ['editor', 'viewer'];
    return [];
  }
  function canManageMember(target) {
    if (!target || target.name === me || target.role === 'owner') return false;
    if (role() === 'owner') return true;
    if (role() === 'admin') return target.role === 'editor' || target.role === 'viewer';
    return false;
  }

  function setRole(id, newRole) {
    const target = members.find((m) => m.id === id);
    if (!canManageMember(target) || !assignableRoles().includes(newRole)) return false;
    target.role = newRole;
    save();
    emit('members', { id });
    return true;
  }

  function addMember(name, newRole) {
    name = String(name || '').trim();
    if (!name) return 'empty';
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) return 'exists';
    if (!assignableRoles().includes(newRole)) return 'denied';
    members.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, role: newRole });
    save();
    emit('members', { name });
    return 'ok';
  }

  function removeMember(id) {
    const target = members.find((m) => m.id === id);
    if (!canManageMember(target)) return false;
    members = members.filter((m) => m.id !== id);
    save();
    emit('members', { id });
    return true;
  }

  // Режим «посмотреть как…» — чтобы проверить, что видит и может каждая роль
  function setPreview(r) {
    preview = (r && ROLES[r] && r !== 'owner') ? r : null;
    try {
      if (preview) sessionStorage.setItem(PREVIEW_KEY, preview); else sessionStorage.removeItem(PREVIEW_KEY);
    } catch (e) { /* нет доступа */ }
    emit('role');
  }
  if (preview && !['owner', 'admin'].includes(realRole())) preview = null;

  // ----- «в сети» -----
  function readPresence() {
    try { return JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function writePresence(p) {
    try { localStorage.setItem(PRESENCE_KEY, JSON.stringify(p)); } catch (e) { /* не страшно */ }
  }
  function beat() {
    const p = readPresence();
    p[me] = Date.now();
    writePresence(p);
  }
  function leave() {
    const p = readPresence();
    p[me] = Date.now() - ONLINE_MS - 1;
    writePresence(p);
  }
  const lastSeen = (name) => readPresence()[name] || 0;
  const isOnline = (name) => Date.now() - lastSeen(name) < ONLINE_MS;

  function ago(ts) {
    if (!ts) return 'Не в сети';
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return 'Не в сети · только что';
    const m = Math.floor(s / 60);
    if (m < 60) return `Не в сети · ${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Не в сети · ${h} ч назад`;
    return `Не в сети · ${Math.floor(h / 24)} дн назад`;
  }

  beat();
  setInterval(() => { beat(); emit('presence'); }, BEAT_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { beat(); emit('presence'); } });
  window.addEventListener('pagehide', leave);

  // Изменения, сделанные в другой вкладке, применяются сразу
  window.addEventListener('storage', (e) => {
    if (e.key === MEMBERS_KEY) {
      const before = role();
      members = load();
      ensureMe();
      emit('members', { external: true, roleChanged: before !== role() });
    } else if (e.key === PRESENCE_KEY) {
      emit('presence');
    }
  });

  function deny() { if (typeof showToast === 'function') showToast('У вашей роли нет прав на это действие', 'error'); }

  return {
    me, ROLES, can, role, realRole, deny,
    getMembers: () => members.slice(),
    getMember, assignableRoles, canManageMember,
    setRole, addMember, removeMember,
    setPreview, isPreview: () => !!preview && preview !== realRole(),
    getPreview: () => preview,
    isOnline, lastSeen, ago,
    onChange: (cb) => listeners.push(cb)
  };
})();
