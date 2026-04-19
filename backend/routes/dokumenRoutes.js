const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const dokumenController = require('../controllers/dokumenController');
const { fileFilter, handleUploadError } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Configure multer with memory storage for upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  }
});

// Get photo for a personnel
router.get('/:sdmType/:personnelId/photo', dokumenController.getPhoto);

// Get all documents for a personnel
router.get('/:sdmType/:personnelId', dokumenController.getDocuments);

// Upload document (multipart/form-data)
router.post('/upload',
  upload.single('file'),
  handleUploadError,
  dokumenController.uploadDocument
);

// Get file (download/preview)
router.get('/file/:sdmType/:personnelId/:filename', dokumenController.getFile);

// Delete single document
router.delete('/:sdmType/:personnelId/:documentKey', dokumenController.deleteDocument);

// Delete all documents for personnel
router.delete('/:sdmType/:personnelId', dokumenController.deleteAllDocuments);

module.exports = router;
