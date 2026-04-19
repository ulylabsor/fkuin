const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { dokumenConfig } = require('../utils/dokumenConfig');
const { ensureUploadDir, deleteFileByDocKey } = require('../utils/fileUtils');

// Logging helper
const log = (...args) => console.log('[MULTER]', new Date().toISOString(), ...args);

// Storage engine dengan konfigurasi dinamis
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    log('destination called');
    log('req.body:', req.body);
    const { sdmType, personnelId } = req.body;
    log('sdmType:', sdmType, 'personnelId:', personnelId);

    const config = dokumenConfig[sdmType];
    if (!config) {
      log('ERROR: Jenis SDM tidak valid');
      return cb(new Error('Jenis SDM tidak valid'));
    }

    const uploadPath = ensureUploadDir(sdmType, personnelId);
    if (!uploadPath) {
      log('ERROR: Gagal membuat direktori upload');
      return cb(new Error('Gagal membuat direktori upload'));
    }

    log('destination ok:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    log('filename called');
    const { sdmType, documentKey } = req.body;
    log('documentKey:', documentKey);

    // Generate unique filename
    const uniqueName = `${documentKey}_${crypto.randomUUID()}${path.extname(file.originalname)}`;
    log('generated filename:', uniqueName);
    cb(null, uniqueName);
  }
});

// File filter untuk validasi tipe file
const fileFilter = (req, file, cb) => {
  log('fileFilter called');
  log('req.body:', req.body);
  const { sdmType, documentKey } = req.body;
  const config = dokumenConfig[sdmType];

  if (!config) {
    log('ERROR: Jenis SDM tidak valid');
    return cb(new Error('Jenis SDM tidak valid'), false);
  }

  // Cari konfigurasi dokumen
  const docConfig = config.documents.find(d => d.key === documentKey);

  if (!docConfig) {
    log('ERROR: Jenis dokumen tidak valid');
    return cb(new Error('Jenis dokumen tidak valid'), false);
  }

  // Validasi ekstensi
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  log('file ext:', ext, 'allowed:', docConfig.extensions);
  if (!docConfig.extensions.includes(ext)) {
    return cb(
      new Error(`Format file tidak valid. Gunakan: ${docConfig.extensions.map(e => e.toUpperCase()).join(', ')}`),
      false
    );
  }

  log('fileFilter passed');
  cb(null, true);
};

// Middleware untuk delete existing file sebelum upload baru
const deleteExistingFile = (req, res, next) => {
  const { sdmType, personnelId, documentKey } = req.body;

  if (sdmType && personnelId && documentKey) {
    // Hapus file existing untuk document key yang sama
    deleteFileByDocKey(sdmType, personnelId, documentKey);
  }

  next();
};

// Create multer instance with memory storage for debugging
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  }
});

// Middleware untuk handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File terlalu besar. Maksimal 10MB' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload,
  deleteExistingFile,
  handleUploadError
};
