const path = require('path');
const pool = require('../config/database');
const { dokumenConfig, toOriginalKey } = require('../utils/dokumenConfig');
const {
  listFiles,
  deleteFile,
  deleteFileByDocKey,
  deleteAllFiles,
  cleanupEmptyDirs,
  findFileByDocKey,
  formatFileSize,
  UPLOAD_BASE_DIR
} = require('../utils/fileUtils');

// Get all document metadata for a personnel
exports.getDocuments = async (req, res) => {
  try {
    const { sdmType, personnelId } = req.params;

    // Validate SDM type
    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    // Get personnel data from database
    const [rows] = await pool.query(
      `SELECT dokumen FROM ${config.tableName} WHERE id = ?`,
      [personnelId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Personil tidak ditemukan' });
    }

    const dokumenList = config.documents;
    const uploadedFiles = listFiles(sdmType, personnelId);

    // Build checklist based on actual files on disk (source of truth)
    // Map folder keys to original database keys
    const uploadedKeys = {}; // { 'Foto': true, 'Surat Perjanjian DT': true, ... }
    uploadedFiles.forEach(file => {
      // Find matching document key in config
      const matchedDoc = dokumenList.find(doc => {
        return file.filename.startsWith(doc.key + '_');
      });
      if (matchedDoc) {
        // Get the original key in database
        const originalKey = toOriginalKey(matchedDoc.key);
        uploadedKeys[originalKey] = true;
      }
    });

    // Sync database with filesystem - checklist purely based on file existence
    let dokumen = rows[0].dokumen;
    if (typeof dokumen === 'string') {
      dokumen = JSON.parse(dokumen);
    }

    let needsUpdate = false;
    Object.keys(dokumen).forEach(key => {
      const shouldBeTrue = !!uploadedKeys[key];
      if (dokumen[key] !== shouldBeTrue) {
        dokumen[key] = shouldBeTrue;
        needsUpdate = true;
      }
    });

    // Update database if needed
    if (needsUpdate) {
      await pool.query(
        `UPDATE ${config.tableName} SET dokumen = ? WHERE id = ?`,
        [JSON.stringify(dokumen), personnelId]
      );
    }

    // Map document types with upload status based on files
    const documents = dokumenList.map(doc => {
      const uploadedFile = findFileByDocKey(sdmType, personnelId, doc.key);

      return {
        key: doc.key,
        label: doc.label,
        extensions: doc.extensions,
        maxSize: doc.maxSize,
        required: doc.required,
        uploaded: !!uploadedFile,
        fileUrl: uploadedFile ? `/api/dokumen/file/${sdmType}/${personnelId}/${uploadedFile.filename}` : null,
        file: uploadedFile ? {
          filename: uploadedFile.filename,
          path: uploadedFile.path,
          size: uploadedFile.size,
          sizeFormatted: uploadedFile.sizeFormatted,
          created: uploadedFile.created
        } : null
      };
    });

    res.json({
      personnelId: parseInt(personnelId),
      sdmType,
      documents,
      synced: needsUpdate
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Gagal mengambil data dokumen' });
  }
};

// Upload single document
exports.uploadDocument = async (req, res) => {
  try {
    const { sdmType, personnelId, documentKey } = req.body;
    const file = req.file;

    console.log('=== Upload Debug ===');
    console.log('body:', req.body);
    console.log('file:', file ? { originalname: file.originalname, size: file.size, mimetype: file.mimetype } : null);
    console.log('====================');

    if (!file) {
      console.log('ERROR: No file found in request');
      return res.status(400).json({ error: 'Tidak ada file diunggah' });
    }

    // Get document configuration
    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    const docConfig = config.documents.find(d => d.key === documentKey);
    if (!docConfig) {
      return res.status(400).json({ error: 'Jenis dokumen tidak valid' });
    }

    // Validate file size
    const maxSizeBytes = docConfig.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return res.status(400).json({
        error: `File terlalu besar. Maksimal ${docConfig.maxSize}MB`
      });
    }

    // Save file to disk
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    const { ensureUploadDir } = require('../utils/fileUtils');

    const uploadDir = ensureUploadDir(sdmType, personnelId);
    const filename = `${documentKey}_${crypto.randomUUID()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    // Update database: mark document as complete
    const originalKey = toOriginalKey(documentKey);

    const [rows] = await pool.query(
      `SELECT dokumen FROM ${config.tableName} WHERE id = ?`,
      [personnelId]
    );

    if (rows.length > 0) {
      let dokumen = rows[0].dokumen;
      if (typeof dokumen === 'string') {
        dokumen = JSON.parse(dokumen);
      }

      // Find and update the matching key in dokumen
      const matchingKey = Object.keys(dokumen).find(k => {
        const normalizedK = k.toLowerCase().replace(/\s+/g, '_');
        const normalizedDocKey = documentKey.toLowerCase();
        return normalizedK === normalizedDocKey ||
          k.toLowerCase() === toOriginalKey(documentKey).toLowerCase() ||
          k.toLowerCase().replace(/\s+/g, '') === documentKey.toLowerCase().replace(/_/g, '');
      });

      if (matchingKey) {
        dokumen[matchingKey] = true;
      } else {
        dokumen[originalKey] = true;
      }

      await pool.query(
        `UPDATE ${config.tableName} SET dokumen = ? WHERE id = ?`,
        [JSON.stringify(dokumen), personnelId]
      );
    }

    res.json({
      message: 'File berhasil diunggah',
      file: {
        filename: filename,
        path: `${sdmType}/${personnelId}/${filename}`,
        size: file.size,
        sizeFormatted: formatFileSize(file.size)
      }
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: 'Gagal memproses upload' });
  }
};

// Serve file
exports.getFile = async (req, res) => {
  try {
    const { sdmType, personnelId, filename } = req.params;
    const filePath = path.join(UPLOAD_BASE_DIR, sdmType, personnelId, filename);

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(UPLOAD_BASE_DIR)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan' });
    }

    // Set content type based on extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Gagal menampilkan file' });
  }
};

// Delete single document
exports.deleteDocument = async (req, res) => {
  try {
    const { sdmType, personnelId, documentKey } = req.params;

    // Validate SDM type
    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    // Delete file
    deleteFileByDocKey(sdmType, personnelId, documentKey);

    // Update database: mark document as incomplete
    const originalKey = toOriginalKey(documentKey);

    const [rows] = await pool.query(
      `SELECT dokumen FROM ${config.tableName} WHERE id = ?`,
      [personnelId]
    );

    if (rows.length > 0) {
      let dokumen = rows[0].dokumen;
      if (typeof dokumen === 'string') {
        dokumen = JSON.parse(dokumen);
      }

      // Find and update the matching key in dokumen
      const matchingKey = Object.keys(dokumen).find(k => {
        const normalizedK = k.toLowerCase().replace(/\s+/g, '_');
        const normalizedDocKey = documentKey.toLowerCase();
        return normalizedK === normalizedDocKey ||
          k.toLowerCase() === toOriginalKey(documentKey).toLowerCase();
      });

      if (matchingKey) {
        dokumen[matchingKey] = false;
        await pool.query(
          `UPDATE ${config.tableName} SET dokumen = ? WHERE id = ?`,
          [JSON.stringify(dokumen), personnelId]
        );
      }
    }

    // Clean up empty directories
    cleanupEmptyDirs(sdmType, personnelId);

    res.json({ message: 'Dokumen berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Gagal menghapus dokumen' });
  }
};

// Delete all documents for personnel
exports.deleteAllDocuments = async (req, res) => {
  try {
    const { sdmType, personnelId } = req.params;

    // Validate SDM type
    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    // Delete all files
    deleteAllFiles(sdmType, personnelId);

    // Reset all documents to false in database
    const [rows] = await pool.query(
      `SELECT dokumen FROM ${config.tableName} WHERE id = ?`,
      [personnelId]
    );

    if (rows.length > 0) {
      let dokumen = rows[0].dokumen;
      if (typeof dokumen === 'string') {
        dokumen = JSON.parse(dokumen);
      }

      // Set all documents to false
      Object.keys(dokumen).forEach(key => {
        dokumen[key] = false;
      });

      await pool.query(
        `UPDATE ${config.tableName} SET dokumen = ? WHERE id = ?`,
        [JSON.stringify(dokumen), personnelId]
      );
    }

    res.json({ message: 'Semua dokumen berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting all documents:', error);
    res.status(500).json({ error: 'Gagal menghapus semua dokumen' });
  }
};

// Get photo URL for a person
exports.getPhoto = async (req, res) => {
  try {
    const { sdmType, personnelId } = req.params;

    // Validate SDM type
    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    // Check if Foto document is marked as uploaded
    const [rows] = await pool.query(
      `SELECT dokumen FROM ${config.tableName} WHERE id = ?`,
      [personnelId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Personil tidak ditemukan' });
    }

    let dokumen = rows[0].dokumen;
    if (typeof dokumen === 'string') {
      dokumen = JSON.parse(dokumen);
    }

    // Check if Foto is marked as uploaded
    const hasFoto = dokumen['Foto'] === true;

    // Find the actual photo file
    let photoUrl = null;
    if (hasFoto) {
      const files = listFiles(sdmType, personnelId);
      const fotoFile = files.find(f => f.filename.startsWith('Foto_'));
      if (fotoFile) {
        photoUrl = `/uploads/${fotoFile.path}`;
      }
    }

    res.json({
      hasFoto,
      photoUrl
    });
  } catch (error) {
    console.error('Error getting photo:', error);
    res.status(500).json({ error: 'Gagal mengambil foto' });
  }
};

// Get file info for all personnel (admin)
exports.getAllFilesInfo = async (req, res) => {
  try {
    const { sdmType } = req.params;
    const { dokumenConfig } = require('../utils/dokumenConfig');
    const { listFiles, findFileByDocKey } = require('../utils/fileUtils');

    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    // Get all personnel
    const [rows] = await pool.query(`SELECT id, nama, dokumen FROM ${config.tableName}`);

    const personnel = rows.map(person => {
      const files = listFiles(sdmType, person.id);
      const documents = config.documents.map(doc => {
        const file = findFileByDocKey(sdmType, person.id, doc.key);
        return {
          key: doc.key,
          label: doc.label,
          hasFile: !!file,
          filename: file ? file.filename : null,
          fileUrl: file ? `/api/dokumen/file/${sdmType}/${person.id}/${file.filename}` : null
        };
      });
      return {
        id: person.id,
        nama: person.nama,
        documents
      };
    });

    res.json({ personnel, sdmType });
  } catch (error) {
    console.error('Error getting all files info:', error);
    res.status(500).json({ error: 'Gagal mengambil info file' });
  }
};

// Helper function to check file existence
const fs = require('fs');
