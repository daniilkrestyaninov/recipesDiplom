const { minioClient, bucketName } = require('../config/minio');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const uploadController = {
  // POST /upload
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не загружен' });
      }

      const file = req.file;
      const extension = path.extname(file.originalname);
      // Генерируем уникальное имя файла: folder/uuid.ext
      // Папка по умолчанию 'general', можно передавать в req.body.folder
      const folder = req.body.folder || 'general';
      const fileName = `${folder}/${uuidv4()}${extension}`;

      // Загружаем в MinIO
      await minioClient.putObject(
        bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );

      // Формируем публичный URL.
      // Предполагается, что MinIO доступен по MINIO_ENDPOINT:MINIO_PORT
      const endPoint = process.env.MINIO_ENDPOINT || '10.8.0.40';
      const port = process.env.MINIO_PORT || 9000;
      const protocol = 'http'; // можно настроить через env
      
      const fileUrl = `${protocol}://${endPoint}:${port}/${bucketName}/${fileName}`;

      res.status(201).json({
        message: 'Файл успешно загружен',
        url: fileUrl,
        fileName: fileName,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка загрузки файла', error: err.message });
    }
  },

  // DELETE /upload?fileName=...
  deleteImage: async (req, res) => {
    try {
      const { fileName } = req.query;
      if (!fileName) {
        return res.status(400).json({ message: 'Укажите fileName' });
      }

      await minioClient.removeObject(bucketName, fileName);
      res.json({ message: 'Файл удалён' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка удаления файла', error: err.message });
    }
  }
};

module.exports = uploadController;
