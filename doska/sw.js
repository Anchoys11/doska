// Сервис-воркер: приложение открывается без интернета.
// ВАЖНО: при добавлении/удалении файлов увеличьте VERSION, чтобы обновился кэш.
const VERSION = 'doska-v1';
const FEATHER = 'https://unpkg.com/feather-icons@4.29.0/dist/feather.min.js';
const CORE = [
  "./",
  "board.html",
  "boards.html",
  "css/animations.css",
  "css/auth.css",
  "css/board.css",
  "css/boards-modal.css",
  "css/boards.css",
  "css/chat.css",
  "css/color-picker.css",
  "css/image.css",
  "css/members.css",
  "css/mobile.css",
  "css/modal.css",
  "css/reactions.css",
  "css/sticker.css",
  "css/theme.css",
  "css/toolbar.css",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/icon.svg",
  "index.html",
  "js/auth.js",
  "js/board/canvas.js",
  "js/board/chat.js",
  "js/board/color-picker.js",
  "js/board/drag.js",
  "js/board/file-logic.js",
  "js/board/files.js",
  "js/board/images.js",
  "js/board/main.js",
  "js/board/permissions.js",
  "js/board/reactions.js",
  "js/board/stickers.js",
  "js/board/ui.js",
  "js/boards.js",
  "js/common.js",
  "manifest.webmanifest"
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    try { await cache.add(new Request(FEATHER, { mode: 'no-cors' })); } catch (e) { /* без интернета при первой установке */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && req.url !== FEATHER) return;

  // Страницы: сначала сеть (чтобы видеть обновления), без сети — из кэша
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match(req, { ignoreSearch: true })) ||
               (await caches.match('boards.html')) || (await caches.match('index.html'));
      }
    })());
    return;
  }

  // Остальное: из кэша сразу, а в фоне обновляем
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) caches.open(VERSION).then((c) => c.put(req, res.clone()));
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
