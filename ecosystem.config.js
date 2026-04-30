module.exports = {
  apps: [
    {
      name: 'minio-server',
      script: 'C:\\IMPORTANT\\S3\\minio.exe',
      args: 'server C:\\IMPORTANT\\S3\\data',
      interpreter: 'none',
    },
  ],
};
