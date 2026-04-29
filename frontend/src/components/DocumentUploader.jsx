import { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  Eye,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image,
  File as FileIcon
} from 'lucide-react';
import { uploadDocument, deleteDocument, BACKEND_URL } from '../api/api';

const DocumentUploader = ({
  sdmType,
  personnelId,
  documentKey,
  label,
  allowedExtensions,
  maxSizeMB,
  required,
  existingFile,
  onUploadComplete,
  onDeleteComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    setError(null);

    // Validate file type
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Format tidak valid. Gunakan: ${allowedExtensions.map(e => e.toUpperCase()).join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File terlalu besar. Maksimal ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sdmType', sdmType);
      formData.append('personnelId', personnelId.toString());
      formData.append('documentKey', documentKey);

      await uploadDocument(formData);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus file ini?')) return;

    try {
      await deleteDocument(sdmType, personnelId, documentKey);
      if (onDeleteComplete) onDeleteComplete();
    } catch (err) {
      setError('Gagal menghapus file');
    }
  };

  const getFileUrl = (path) => {
    return `${BACKEND_URL}/uploads/${path}`;
  };

  const isImage = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const getFileIcon = () => {
    if (!existingFile) return <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />;

    if (isImage(existingFile.filename)) {
      return <Image className="w-5 h-5 text-emerald-600" />;
    }

    return <FileIcon className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {required && <span className="text-xs text-red-500">*</span>}
      </div>

      {existingFile ? (
        // File exists - show preview/download/delete
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate" title={existingFile.filename}>
              {existingFile.filename.split('_').slice(1).join('_')}
            </p>
            <p className="text-xs text-slate-500">{existingFile.sizeFormatted}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={getFileUrl(existingFile.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Lihat"
            >
              <Eye className="w-4 h-4" />
            </a>
            <a
              href={getFileUrl(existingFile.path)}
              download={existingFile.filename}
              className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Unduh"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // No file - show upload area
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer
            ${dragActive
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }
            ${error ? 'border-red-400 bg-red-50' : ''}
            ${uploading ? 'pointer-events-none opacity-70' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedExtensions.map(e => `.${e}`).join(',')}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
              <p className="text-sm text-slate-600">Mengunggah...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                Klik atau drag file ke sini
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {allowedExtensions.map(e => e.toUpperCase()).join(', ')} - Max {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 mt-2 text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {!existingFile && !error && !uploading && (
        <div className="flex items-center gap-1 mt-2 text-slate-400">
          <CheckCircle className="w-3 h-3" />
          <p className="text-xs">Belum diunggah</p>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
