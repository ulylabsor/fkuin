import { useState, useEffect } from 'react';
import { X, FileText, Loader2, CheckCircle, Save } from 'lucide-react';
import DocumentUploader from './DocumentUploader';
import { getDocuments } from '../api/api';

const DocumentModal = ({
  isOpen,
  onClose,
  sdmType,
  personnelId,
  personnelName,
  onSave,
  onRefresh
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedMessage, setSavedMessage] = useState(null);

  useEffect(() => {
    if (isOpen && sdmType && personnelId) {
      loadDocuments();
    }
  }, [isOpen, sdmType, personnelId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getDocuments(sdmType, personnelId);
      setDocuments(res.data.documents);
    } catch (err) {
      setError('Gagal memuat dokumen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    loadDocuments();
    if (onRefresh) onRefresh();
    setHasChanges(true);
    setSavedMessage('File berhasil diunggah dan disimpan!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleDeleteComplete = () => {
    loadDocuments();
    if (onRefresh) onRefresh();
    setHasChanges(true);
    setSavedMessage('File berhasil dihapus!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleSave = () => {
    if (onSave) onSave();
    if (onRefresh) onRefresh();
    setHasChanges(false);
    setSavedMessage('Data berhasil disimpan!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const completedCount = documents.filter(d => d.uploaded).length;
  const totalRequired = documents.filter(d => d.required).length;
  const completedRequired = documents.filter(d => d.required && d.uploaded).length;
  const progress = documents.length > 0
    ? Math.round((completedCount / documents.length) * 100)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Berkas Dokumen</h2>
              <p className="text-sm text-slate-500 mt-0.5">{personnelName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {savedMessage && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-emerald-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{savedMessage}</span>
          </div>
        )}

        {/* Progress */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">
                {completedCount} dari {documents.length} dokumen diunggah
              </span>
              {totalRequired > 0 && (
                <span className="text-sm text-slate-400">
                  ({completedRequired}/{totalRequired} wajib)
                </span>
              )}
            </div>
            <span className="text-sm font-semibold text-emerald-600">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={loadDocuments}
                className="text-emerald-600 hover:underline text-sm"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <DocumentUploader
                  key={doc.key}
                  sdmType={sdmType}
                  personnelId={personnelId}
                  documentKey={doc.key}
                  label={doc.label}
                  allowedExtensions={doc.extensions}
                  maxSizeMB={doc.maxSize}
                  required={doc.required}
                  existingFile={doc.file}
                  onUploadComplete={handleUploadComplete}
                  onDeleteComplete={handleDeleteComplete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            {hasChanges && (
              <span className="flex items-center gap-1 text-amber-600">
                <CheckCircle className="w-4 h-4" />
                Ada perubahan yang belum disimpan
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Tutup
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
