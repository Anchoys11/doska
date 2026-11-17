// Своя палитра (вместо системной, которая открывалась где-то далеко).
// Открывается рядом с тем местом, откуда её вызвали.
const ColorPicker = (() => {
  const RECENT_KEY = 'recentColors';
  let pop = null, sv, svThumb, hue, hueThumb, preview, hexInput, recentBox;
  let hsv = { h: 260, s: 0.64, v: 1 };
  let opts = null;
  let startHex = '';

  const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

  function hsvToHex({ h, s, v }) {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    };
    return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }

  function parseHex(str) {
    let s = String(str || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
    return /^[0-9a-f]{6}$/i.test(s) ? '#' + s.toLowerCase() : null;
  }

  function hexToHsv(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveRecent(hex) {
    try {
      const list = getRecent().filter((c) => c !== hex);
      list.unshift(hex);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 7)));
    } catch (e) { /* хранилище недоступно — не страшно */ }
  }

  function bindDrag(el, fn) {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      fn(e);
      const move = (ev) => fn(ev);
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }

  function render(keepInput) {
    const hex = hsvToHex(hsv);
    sv.style.setProperty('--h', Math.round(hsv.h));
    svThumb.style.left = hsv.s * 100 + '%';
    svThumb.style.top = (1 - hsv.v) * 100 + '%';
    hueThumb.style.left = (hsv.h / 360) * 100 + '%';
    svThumb.style.background = hex;
    hueThumb.style.background = `hsl(${Math.round(hsv.h)},100%,50%)`;
    preview.style.background = hex;
    if (!keepInput) hexInput.value = hex.toUpperCase();
    return hex;
  }

  function emit() {
    const hex = render(false);
    if (opts && opts.onChange) opts.onChange(hex);
  }

  function setFromHex(hex, notify) {
    const n = hexToHsv(hex);
    hsv = { h: (n.s === 0 || n.v === 0) ? hsv.h : n.h, s: n.s, v: n.v };
    if (notify) emit(); else render(true);
  }

  function renderRecent() {
    recentBox.innerHTML = '';
    getRecent().forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cp-swatch';
      b.style.background = c;
      b.title = c;
      b.addEventListener('click', () => setFromHex(c, true));
      recentBox.appendChild(b);
    });
  }

  function build() {
    pop = document.createElement('div');
    pop.className = 'cp-pop';
    pop.innerHTML = `
      <div class="cp-sv"><div class="cp-thumb"></div></div>
      <div class="cp-hue"><div class="cp-thumb"></div></div>
      <div class="cp-row">
        <span class="cp-preview"></span>
        <input class="cp-hex" type="text" maxlength="7" spellcheck="false" autocomplete="off">
        <button type="button" class="cp-done">Готово</button>
      </div>
      <div class="cp-recent"></div>`;

    sv = pop.querySelector('.cp-sv');
    svThumb = sv.querySelector('.cp-thumb');
    hue = pop.querySelector('.cp-hue');
    hueThumb = hue.querySelector('.cp-thumb');
    preview = pop.querySelector('.cp-preview');
    hexInput = pop.querySelector('.cp-hex');
    recentBox = pop.querySelector('.cp-recent');

    bindDrag(sv, (e) => {
      const r = sv.getBoundingClientRect();
      hsv.s = clamp((e.clientX - r.left) / r.width, 0, 1);
      hsv.v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
      emit();
    });
    bindDrag(hue, (e) => {
      const r = hue.getBoundingClientRect();
      hsv.h = clamp((e.clientX - r.left) / r.width, 0, 1) * 360;
      emit();
    });

    // Пока вводим HEX — только показываем; применяем, когда ввод закончен
    hexInput.addEventListener('input', () => {
      const hex = parseHex(hexInput.value);
      if (hex) setFromHex(hex, false);
    });
    hexInput.addEventListener('change', () => {
      const hex = parseHex(hexInput.value);
      if (hex) setFromHex(hex, true);
      hexInput.value = hsvToHex(hsv).toUpperCase();
    });
    hexInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') hexInput.blur(); });

    pop.querySelector('.cp-done').addEventListener('click', close);

    // Не отбираем фокус (и выделение текста в заметке), кроме поля HEX
    pop.addEventListener('mousedown', (e) => { if (e.target !== hexInput) e.preventDefault(); });
  }

  function place() {
    const r = opts.anchor.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const gap = 12, m = 8, vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    let left, top;
    const above = () => { top = r.top - gap - h; left = r.left + r.width / 2 - w / 2; return top >= m; };
    const side = () => {
      top = r.top + r.height / 2 - h / 2;
      if (r.right + gap + w <= vw - m) { left = r.right + gap; return true; }
      if (r.left - gap - w >= m) { left = r.left - gap - w; return true; }
      return false;
    };
    const ok = Utils.isCompact() ? (above() || side()) : (side() || above());
    if (!ok) { top = r.bottom + gap; left = r.left + r.width / 2 - w / 2; }
    pop.style.left = clamp(left, m, Math.max(m, vw - w - m)) + 'px';
    pop.style.top = clamp(top, m, Math.max(m, vh - h - m)) + 'px';
  }

  function onOutside(e) {
    if (!pop) return;
    const t = e.target;
    if (pop.contains(t)) return;
    if ((opts.exempt || []).some((el) => el && el.contains(t))) return;
    close();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function open(o) {
    if (pop) close();
    opts = o;
    build();
    startHex = parseHex(o.color) || '#7c5cff';
    hsv = hexToHsv(startHex);
    document.body.appendChild(pop);
    render(false);
    renderRecent();
    place();
    requestAnimationFrame(() => pop && pop.classList.add('show'));

    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
  }

  function close() {
    if (!pop) return;
    const o = opts;
    const hex = hsvToHex(hsv);
    if (hex !== startHex) saveRecent(hex);
    pop.remove();
    pop = null; opts = null;
    document.removeEventListener('pointerdown', onOutside, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', close);
    if (o && o.onClose) o.onClose();
  }

  return { open, close, isOpen: () => !!pop };
})();
