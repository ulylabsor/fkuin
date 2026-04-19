const fs = require('fs');
const path = require('path');
const { dokumenConfig } = require('./dokumenConfig');

const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads');

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Delete a single file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

// Delete all files for a personnel
const deleteAllFiles = (sdmType, personnelId) => {
  const config = dokumenConfig[sdmType];
  if (!config) return false;

  const personDir = path.join(UPLOAD_BASE_DIR, config.folder, personnelId.toString());

  try {
    if (fs.existsSync(personDir)) {
      fs.rmSync(personDir, { recursive: true, force: true });
      return true;
    }
  } catch (error) {
    console.error('Error deleting directory:', error);
  }
  return false;
};

// Get file info
const getFileInfo = (relativePath) => {
  const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const stats = fs.statSync(fullPath);
  return {
    path: relativePath,
    size: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    created: stats.birthtime,
    modified: stats.mtime
  };
};

// List files for a personnel
const listFiles = (sdmType, personnelId) => {
  const config = dokumenConfig[sdmType];
  if (!config) return [];

  const personDir = path.join(UPLOAD_BASE_DIR, config.folder, personnelId.toString());

  if (!fs.existsSync(personDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(personDir);
    return files.map(filename => {
      const fullPath = path.join(personDir, filename);
      const stats = fs.statSync(fullPath);
      // Use forward slashes for URL paths
      const urlPath = `${config.folder}/${personnelId.toString()}/${filename}`;
      return {
        filename,
        path: urlPath,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        created: stats.birthtime
      };
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

// Check if directory is empty
const isDirEmpty = (dirPath) => {
  if (!fs.existsSync(dirPath)) return true;
  return fs.readdirSync(dirPath).length === 0;
};

// Clean up empty directories
const cleanupEmptyDirs = (sdmType, personnelId) => {
  const config = dokumenConfig[sdmType];
  if (!config) return;

  const personDir = path.join(UPLOAD_BASE_DIR, config.folder, personnelId.toString());

  if (fs.existsSync(personDir) && isDirEmpty(personDir)) {
    fs.rmdirSync(personDir);
  }
};

// Ensure upload directory exists
const ensureUploadDir = (sdmType, personnelId) => {
  const config = dokumenConfig[sdmType];
  if (!config) return null;

  const personDir = path.join(UPLOAD_BASE_DIR, config.folder, personnelId.toString());

  if (!fs.existsSync(personDir)) {
    fs.mkdirSync(personDir, { recursive: true });
  }

  return personDir;
};

// Find file by document key
const findFileByDocKey = (sdmType, personnelId, documentKey) => {
  const files = listFiles(sdmType, personnelId);

  // Cari file yang filename dimulai dengan document key (folder key format)
  return files.find(f => {
    return f.filename.startsWith(documentKey + '_');
  });
};

// Delete file by document key
const deleteFileByDocKey = (sdmType, personnelId, documentKey) => {
  const file = findFileByDocKey(sdmType, personnelId, documentKey);
  if (file) {
    const fullPath = path.join(UPLOAD_BASE_DIR, file.path);
    return deleteFile(fullPath);
  }
  return false;
};

module.exports = {
  deleteFile,
  deleteAllFiles,
  getFileInfo,
  formatFileSize,
  listFiles,
  isDirEmpty,
  cleanupEmptyDirs,
  ensureUploadDir,
  findFileByDocKey,
  deleteFileByDocKey,
  UPLOAD_BASE_DIR
};
