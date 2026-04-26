const multer = require('multer');

// Настраиваем хранение в памяти
const storage = multer.memoryStorage();

// Фильтр только для изображений
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только изображения'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
