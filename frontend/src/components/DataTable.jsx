import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Award,
  Mail,
  Save,
  RefreshCw
} from 'lucide-react';
import { getPublicPhoto } from '../api/api';

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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

export default function DataTable({
  title,
  description,
  data,
  loading,
  onRefresh,
  onSave,
  onDelete,
  documentLabels,
  defaultDocuments,
  sdmType
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newPerson, setNewPerson] = useState({ nama: '', bidang: '', kualifikasi: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [photos, setPhotos] = useState({});
  const loadedPhotosRef = useRef(new Set());

  // Load photos for all personnel
  useEffect(() => {
    if (data && data.length > 0 && sdmType) {
      const loadPhotos = async () => {
        for (const person of data) {
          const key = `${sdmType}_${person.id}`;
          if (person.dokumen?.Foto && !loadedPhotosRef.current.has(key)) {
            loadedPhotosRef.current.add(key);
            try {
              const res = await getPublicPhoto(sdmType, person.id);
              if (res.data.photoUrl) {
                setPhotos(prev => ({ ...prev, [key]: res.data.photoUrl }));
              }
            } catch (err) {
              console.error('Error loading photo:', err);
            }
          }
        }
      };
      loadPhotos();
    }
  }, [data, sdmType]);

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

  const handleEdit = (person) => {
    setEditingId(person.id);
    setEditData({ ...person, dokumen: { ...person.dokumen } });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSaveEdit = async () => {
    await onSave(editingId, editData);
    setEditingId(null);
    setEditData(null);
  };

  const handleDokumenChange = (docKey, value) => {
    setEditData(prev => ({
      ...prev,
      dokumen: { ...prev.dokumen, [docKey]: value }
    }));
  };

  const handleAddPerson = async () => {
    if (!newPerson.nama.trim()) return;
    await onSave(null, { ...newPerson, dokumen: defaultDocuments });
    setNewPerson({ nama: '', bidang: '', kualifikasi: '' });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      await onDelete(id);
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-slate-500 mt-1">{description}</p>
        </div>
        <button
          onClick={() => onRefresh()}
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
              statusFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Semua ({data.length})
          </button>
          <button
            onClick={() => setStatusFilter('incomplete')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === 'incomplete'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Perlu Tindakan ({totalIncomplete})
          </button>
          <button
            onClick={() => setStatusFilter('complete')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === 'complete'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
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
              placeholder="Nama Lengkap"
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
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Data Grid */}
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredData.map((person) => {
            const progress = calculateProgress(person.dokumen);
            const isEditing = editingId === person.id;
            const isExpanded = expandedId === person.id;
            const photoKey = `${sdmType}_${person.id}`;

            return (
              <div
                key={person.id}
                className={`bg-white rounded-2xl border ${
                  isExpanded ? 'border-slate-300 shadow-md' : 'border-slate-200 shadow-sm'
                } hover:shadow-md hover:border-slate-300 transition-all flex flex-col`}
              >
                {/* Header */}
                <div
                  className="p-5 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : person.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                      <CircularProgress percentage={progress.percentage} />
                      {photos[photoKey] ? (
                        <img
                          src={photos[photoKey]}
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
                        style={photos[photoKey] ? { display: 'none' } : {}}
                      >
                        {getInitials(person.nama)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-[15px] leading-tight truncate pr-2">
                          {person.nama}
                        </h4>
                        <div
                          className={`p-1 rounded-full flex-shrink-0 transition-transform ${
                            progress.isComplete
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          } ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 font-medium truncate mt-0.5">
                        {person.bidang || '-'}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            progress.isComplete
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}
                        >
                          {progress.isComplete ? 'Lengkap' : 'Belum Lengkap'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {progress.completed}/{progress.total} Syarat
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="bg-slate-50 rounded-b-2xl border-t border-slate-100">
                    {/* Kualifikasi */}
                    <div className="px-5 py-3 border-b border-slate-200/60 flex items-center gap-2 bg-white">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">
                        {person.kualifikasi || 'Kualifikasi'}
                      </span>
                    </div>

                    {/* Checklist */}
                    <div className="p-5 space-y-2.5">
                      {Object.keys(person.dokumen).map((key) => (
                        <div key={key} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {isEditing ? (
                              <button
                                onClick={() => handleDokumenChange(key, !editData.dokumen[key])}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  editData.dokumen[key]
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 hover:border-emerald-400'
                                }`}
                              >
                                {editData.dokumen[key] && <Check className="w-3 h-3" />}
                              </button>
                            ) : (
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center ${
                                  person.dokumen[key]
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white border border-slate-300'
                                }`}
                              >
                                {person.dokumen[key] && <Check className="w-3 h-3" />}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-sm font-medium ${
                                person.dokumen[key] ? 'text-slate-700' : 'text-slate-500'
                              }`}
                            >
                              {key}
                            </span>
                            {!person.dokumen[key] && (
                              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                                Wajib Dilengkapi
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-slate-200/60 bg-white flex justify-between">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Batal
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            Simpan
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(person)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(person.id)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 mb-1">Data tidak ditemukan</h4>
          <p className="text-sm text-slate-500">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
        </div>
      )}
    </div>
  );
}
