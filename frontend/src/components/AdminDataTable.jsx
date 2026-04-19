import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  Award,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileUp,
  X
} from 'lucide-react';
import DocumentModal from './DocumentModal';
import { getPhoto } from '../api/api';

// Urutan dokumen sesuai dengan modal upload
const documentOrder = {
  dosenSarjana: [
    'Foto', 'KTP', 'Surat Perjanjian DT', 'Surat Penugasan Rector', 'Pernyataan EWMP',
    'CV', 'SIP', 'STR', 'Sertifikat Pelatihan', 'Ijazah S1', 'Ijazah Profesi', 'Ijazah S2',
    'Transkrip S1', 'Transkrip Profesi', 'Transkrip S2'
  ],
  pembimbingKlinik: [
    'Foto', 'KTP', 'Surat Penugasan', 'CV', 'STR', 'SIP', 'Ijazah Spesialis',
    'Serkam', 'Ijazah (S1-S2)', 'Transkrip'
  ],
  tendik: [
    'Foto', 'KTP', 'Ijazah', 'Transkrip', 'Sertifikat', 'Surat Pernyataan'
  ]
};

const getOrderedKeys = (dokumen, sdmType) => {
  const order = documentOrder[sdmType] || Object.keys(dokumen);
  return order.filter(key => key in dokumen);
};

const calculateProgress = (dokumen) => {
  if (!dokumen) return { completed: 0, total: 0, percentage: 0, isComplete: false };
  const keys = Object.keys(dokumen);
  if (keys.length === 0) return { completed: 0, total: 0, percentage: 0, isComplete: false };
  const completed = keys.filter(k => dokumen[k]).length;
  return {
    completed,
    total: keys.length,
    percentage: Math.round((completed / keys.length) * 100),
    isComplete: completed === keys.length
  };
};

const CircularProgress = ({ percentage, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let color = '#ef4444';
  if (percentage === 100) color = '#10b981';
  else if (percentage >= 50) color = '#f59e0b';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out" />
    </svg>
  );
};

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200'
  };

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[type]} animate-slide-up`}>
      {icons[type]}
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/50 rounded-lg transition-colors">
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}

export default function AdminDataTable({
  title,
  description,
  data,
  loading,
  onRefresh,
  onAdd,
  onDelete,
  sdmType
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [newPerson, setNewPerson] = useState({ nama: '', bidang: '', kualifikasi: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [documentModal, setDocumentModal] = useState({
    open: false,
    personnelId: null,
    personnelName: ''
  });
  const [photos, setPhotos] = useState({});

  // Load photos for all personnel
  useEffect(() => {
    if (data && data.length > 0) {
      data.forEach(async (person) => {
        if (person.dokumen?.Foto && !photos[person.id]) {
          try {
            const res = await getPhoto(sdmType, person.id);
            if (res.data.photoUrl) {
              setPhotos(prev => ({ ...prev, [person.id]: res.data.photoUrl }));
            }
          } catch (err) {
            console.error('Error loading photo:', err);
          }
        }
      });
    }
  }, [data, sdmType]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredData = data.filter(person => {
    const matchSearch = person.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        person.bidang?.toLowerCase().includes(searchTerm.toLowerCase());
    const progress = calculateProgress(person.dokumen);
    let matchStatus = true;
    if (statusFilter === 'complete') matchStatus = progress.isComplete;
    if (statusFilter === 'incomplete') matchStatus = !progress.isComplete;
    return matchSearch && matchStatus;
  });

  const totalComplete = data.filter(p => calculateProgress(p.dokumen).isComplete).length;
  const totalIncomplete = data.length - totalComplete;

  const getInitials = (name) => {
    let cleanName = name.replace(/^(dr\.|Dr\.|Hj\.)\s*/i, '');
    return cleanName.substring(0, 2).toUpperCase();
  };

  const handleOpenDocuments = (person) => {
    setDocumentModal({
      open: true,
      personnelId: person.id,
      personnelName: person.nama
    });
  };

  const handleAddPerson = async () => {
    if (!newPerson.nama.trim()) {
      showToast('Nama harus diisi', 'warning');
      return;
    }
    try {
      await onAdd({ ...newPerson });
      setNewPerson({ nama: '', bidang: '', kualifikasi: '' });
      setShowForm(false);
      showToast('Data berhasil ditambahkan!', 'success');
    } catch (err) {
      console.error('Error adding:', err);
      showToast('Gagal menambahkan data', 'error');
    }
  };

  const handleDelete = async (id) => {
    const person = data.find(p => p.id === id);
    if (!window.confirm(`Yakin ingin menghapus "${person?.nama}"?`)) return;
    try {
      await onDelete(id);
      showToast('Data berhasil dihapus!', 'success');
    } catch (err) {
      console.error('Error deleting:', err);
      showToast('Gagal menghapus data', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <p className="text-slate-500 mt-1">{description}</p>
          </div>
          <button
            onClick={() => { onRefresh(); showToast('Data diperbarui', 'success'); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau bidang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Semua ({data.length})
            </button>
            <button
              onClick={() => setStatusFilter('incomplete')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === 'incomplete' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Perlu Tindakan ({totalIncomplete})
            </button>
            <button
              onClick={() => setStatusFilter('complete')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === 'complete' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Lengkap ({totalComplete})
            </button>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Data
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Tambah Personel Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nama Lengkap *"
                value={newPerson.nama}
                onChange={(e) => setNewPerson({ ...newPerson, nama: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Bidang"
                value={newPerson.bidang}
                onChange={(e) => setNewPerson({ ...newPerson, bidang: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Kualifikasi"
                value={newPerson.kualifikasi}
                onChange={(e) => setNewPerson({ ...newPerson, kualifikasi: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddPerson}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
              <button
                onClick={() => { setShowForm(false); setNewPerson({ nama: '', bidang: '', kualifikasi: '' }); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Data Grid */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredData.map((person) => {
              const progress = calculateProgress(person.dokumen);
              const isExpanded = expandedId === person.id;

              return (
                <div
                  key={person.id}
                  className={`bg-white rounded-2xl border-2 ${
                    isExpanded ? 'border-slate-300 shadow-md' : 'border-slate-200 shadow-sm'
                  } hover:shadow-md transition-all flex flex-col`}
                >
                  {/* Header */}
                  <div
                    className="p-5 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : person.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                        <CircularProgress percentage={progress.percentage} />
                        {photos[person.id] ? (
                          <img
                            src={photos[person.id]}
                            alt={person.nama}
                            className="absolute w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`absolute w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            progress.isComplete
                              ? 'bg-emerald-50 text-emerald-600'
                              : progress.percentage >= 50
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-red-50 text-red-500'
                          }`}
                          style={photos[person.id] ? { display: 'none' } : {}}
                        >
                          {getInitials(person.nama)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 text-[15px] leading-tight truncate pr-2">{person.nama}</h4>
                          <div className={`p-1 rounded-full flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium truncate mt-0.5">{person.bidang || '-'}</p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            progress.isComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {progress.isComplete ? 'Lengkap' : 'Belum Lengkap'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{progress.completed}/{progress.total} Syarat</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-slate-50 rounded-b-2xl border-t border-slate-100">
                      <div className="px-5 py-3 border-b border-slate-200/60 flex items-center gap-2 bg-white">
                        <Award className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">{person.kualifikasi || 'Kualifikasi'}</span>
                      </div>

                      <div className="px-5 py-3 max-h-48 overflow-y-auto">
                          <div className="grid grid-cols-2 gap-1">
                            {getOrderedKeys(person.dokumen, sdmType).map((key) => (
                              <div key={key} className="flex items-center gap-1 p-1 rounded">
                                <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                  person.dokumen[key] ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-300'
                                }`}>
                                  {person.dokumen[key] && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className={`text-xs ${person.dokumen[key] ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{key}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      <div className="p-4 border-t border-slate-200/60 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <button onClick={() => handleOpenDocuments(person)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                            <FileUp className="w-4 h-4" /> Upload Dokumen
                          </button>
                        </div>
                        <div className="flex justify-end">
                          <button onClick={() => handleDelete(person.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">Tidak ada data yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Document Modal */}
      <DocumentModal
        isOpen={documentModal.open}
        onClose={() => setDocumentModal(prev => ({ ...prev, open: false }))}
        sdmType={sdmType}
        personnelId={documentModal.personnelId}
        personnelName={documentModal.personnelName}
        onRefresh={onRefresh}
      />

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
