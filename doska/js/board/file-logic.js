// ===== ЛОГИКА ЗАГРУЗКИ =====
// Картинки
const imageInput = document.getElementById('imageInput');
if (imageInput) {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tool[data-tool="image"]')) {
      imageInput.click();
    }
  });
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const pos = { x: 100, y: 100 }; // Можно улучшить, чтобы появлялось в центре
      ImagesModule.create(pos.x, pos.y, ev.target.result);
    };
    reader.readAsDataURL(file);
    imageInput.value = '';
  });
}

// Файлы
const fileInput = document.getElementById('fileInput');
if (fileInput) {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tool[data-tool="file"]')) {
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const pos = { x: 150, y: 150 };
    FilesModule.create(pos.x, pos.y, file.name, fileUrl, file.type);
    fileInput.value = '';
  });
}