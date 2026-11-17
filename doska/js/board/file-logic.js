// ===== ЗАГРУЗКА КАРТИНОК И ФАЙЛОВ ЧЕРЕЗ ПАНЕЛЬ =====
// Новый объект появляется в центре того, что сейчас видно на экране.
let spawnShift = 0;
function spawnPoint(halfW, halfH) {
  const c = CanvasModule.getViewportCenter();
  spawnShift = (spawnShift + 24) % 120;
  return { x: c.x - halfW + spawnShift, y: c.y - halfH + spawnShift };
}

const imageInput = document.getElementById('imageInput');
if (imageInput) {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tool[data-tool="image"]') && Permissions.can('edit')) imageInput.click();
  });
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const pos = spawnPoint(120, 80);
      ImagesModule.create(pos.x, pos.y, ev.target.result);
    };
    reader.readAsDataURL(file);
    imageInput.value = '';
  });
}

const fileInput = document.getElementById('fileInput');
if (fileInput) {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tool[data-tool="file"]') && Permissions.can('edit')) fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const pos = spawnPoint(100, 70);
    FilesModule.create(pos.x, pos.y, file.name, URL.createObjectURL(file), file.type);
    fileInput.value = '';
  });
}
