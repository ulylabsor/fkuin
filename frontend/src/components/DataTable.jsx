import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Check,
  X,
  Award,
  Save,
  RefreshCw,
  FileText,
  Eye
} from 'lucide-react';
import { getPublicPhoto } from '../api/api';
import PersonnelDetailModal from './PersonnelDetailModal';

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

const formatUpdatedAt = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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
  defaultDocuments,
  sdmType
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newPerson, setNewPerson] = useState({
    nama: '', nik: '', no_str: '', no_hp: '', alamat_ktp: '',
    tempat_lahir: '', tanggal_lahir: '', mata_kuliah: '', judul_thesis: '',
    bidang: '', kualifikasi: ''
  });
  const [expandedId, setExpandedId] = useState(null);
  const [photos, setPhotos] = useState({});
  const loadedPhotosRef = useRef(new Set());
  const [detailModal, setDetailModal] = useState({ open: false, personnel: null });

  // Stagger animation delay per card index
  const getCardDelay = (index) => `${Math.min(index * 40, 600)}ms`;

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

  const filteredData = useMemo(() => data.filter(person => {
    const matchSearch = person.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        person.bidang?.toLowerCase().includes(searchTerm.toLowerCase());
    const progress = calculateProgress(person.dokumen);
    let matchStatus = true;
    if (statusFilter === 'complete') matchStatus = progress.isComplete;
    if (statusFilter === 'incomplete') matchStatus = !progress.isComplete;
    return matchSearch && matchStatus;
  }), [data, searchTerm, statusFilter]);

  const totalComplete = useMemo(() => data.filter(p => calculateProgress(p.dokumen).isComplete).length, [data]);
  const totalIncomplete = useMemo(() => data.length - totalComplete, [data, totalComplete]);

  const getInitials = useCallback((name) => {
    let cleanName = name.replace(/^(dr\.|Dr\.|Hj\.)\s*/i, '');
    return cleanName.substring(0, 2).toUpperCase();
  }, []);

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

  const handleAddPerson = async () => {
    if (!newPerson.nama.trim()) return;
    await onSave(null, { ...newPerson, dokumen: defaultDocuments });
    setNewPerson({ nama: '', nik: '', no_str: '', no_hp: '', alamat_ktp: '', tempat_lahir: '', tanggal_lahir: '', mata_kuliah: '', judul_thesis: '', bidang: '', kualifikasi: '' });
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
      <style>{`
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-animate {
          animation: card-enter 0.35s ease-out both;
        }
      `}</style>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nama Lengkap *"
              value={newPerson.nama}
              onChange={(e) => setNewPerson({ ...newPerson, nama: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="NIK"
              value={newPerson.nik}
              onChange={(e) => setNewPerson({ ...newPerson, nik: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="No. STR"
              value={newPerson.no_str}
              onChange={(e) => setNewPerson({ ...newPerson, no_str: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="No. HP"
              value={newPerson.no_hp}
              onChange={(e) => setNewPerson({ ...newPerson, no_hp: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Tempat Lahir"
              value={newPerson.tempat_lahir}
              onChange={(e) => setNewPerson({ ...newPerson, tempat_lahir: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="date"
              placeholder="Tanggal Lahir"
              value={newPerson.tanggal_lahir}
              onChange={(e) => setNewPerson({ ...newPerson, tanggal_lahir: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Alamat KTP"
              value={newPerson.alamat_ktp}
              onChange={(e) => setNewPerson({ ...newPerson, alamat_ktp: e.target.value })}
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
            <input
              type="text"
              placeholder="Mata Kuliah"
              value={newPerson.mata_kuliah}
              onChange={(e) => setNewPerson({ ...newPerson, mata_kuliah: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Judul Thesis (opsional)"
              value={newPerson.judul_thesis}
              onChange={(e) => setNewPerson({ ...newPerson, judul_thesis: e.target.value })}
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
        <div className="columns-1 lg:columns-2 xl:columns-3 gap-5">
          {filteredData.map((person) => {
            const progress = calculateProgress(person.dokumen);
            const isEditing = editingId === person.id;
            const isExpanded = expandedId === person.id;
            const photoKey = `${sdmType}_${person.id}`;

            const hasCatatan = !!person.catatan;

            return (
              <div
                key={person.id}
                className={`break-inside-avoid rounded-2xl border-2 flex flex-col transition-all mb-5 card-animate ${
                  isExpanded
                    ? 'border-slate-300 shadow-md'
                    : hasCatatan
                    ? 'border-amber-300 shadow-sm bg-amber-50/30'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                } hover:shadow-md`}
                style={{ animationDelay: getCardDelay(filteredData.indexOf(person)) }}
              >
                {/* Header */}
                <div
                  className="p-5 cursor-pointer select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : person.id);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModal({ open: true, personnel: person, sdmType });
                      }}>
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
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {sdmType === 'dosenTetap' && person.nik && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                            NIK: {person.nik}
                          </span>
                        )}
                        {sdmType === 'dosenTetap' && person.no_hp && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                            HP: {person.no_hp}
                          </span>
                        )}
                        {sdmType === 'dosenTetap' && person.mata_kuliah && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-semibold truncate max-w-[180px]">
                            {person.mata_kuliah}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                        {hasCatatan && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <FileText className="w-3 h-3" />
                            Ada Catatan
                          </span>
                        )}
                        {person.updated_at && (
                          <span className="text-xs text-slate-400 ml-auto">
                            {formatUpdatedAt(person.updated_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="bg-white rounded-b-2xl border-t border-slate-200">
                    {/* Info Detail - Dosen Tetap only */}
                    {sdmType === 'dosenTetap' && (
                      <div className="px-5 pt-4 pb-3 space-y-2 border-b border-slate-100">
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Nama</span>
                              <input value={editData?.nama || ''} onChange={(e) => setEditData(p => ({ ...p, nama: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Bidang</span>
                              <input value={editData?.bidang || ''} onChange={(e) => setEditData(p => ({ ...p, bidang: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Kuali.</span>
                              <input value={editData?.kualifikasi || ''} onChange={(e) => setEditData(p => ({ ...p, kualifikasi: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">NIK</span>
                              <input value={editData?.nik || ''} onChange={(e) => setEditData(p => ({ ...p, nik: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">STR</span>
                              <input value={editData?.no_str || ''} onChange={(e) => setEditData(p => ({ ...p, no_str: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">HP</span>
                              <input value={editData?.no_hp || ''} onChange={(e) => setEditData(p => ({ ...p, no_hp: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">T.Lahir</span>
                              <input value={editData?.tempat_lahir || ''} onChange={(e) => setEditData(p => ({ ...p, tempat_lahir: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Tgl.Lhr</span>
                              <input type="date" value={editData?.tanggal_lahir || ''} onChange={(e) => setEditData(p => ({ ...p, tanggal_lahir: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-1">Alamat</span>
                              <textarea value={editData?.alamat_ktp || ''} onChange={(e) => setEditData(p => ({ ...p, alamat_ktp: e.target.value }))}
                                rows="2"
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">MK</span>
                              <input value={editData?.mata_kuliah || ''} onChange={(e) => setEditData(p => ({ ...p, mata_kuliah: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-1">Thesis</span>
                              <textarea value={editData?.judul_thesis || ''} onChange={(e) => setEditData(p => ({ ...p, judul_thesis: e.target.value }))}
                                rows="2"
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">NIK</span>
                              <span className="text-xs text-slate-700">{person.nik || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">STR</span>
                              <span className="text-xs text-slate-700">{person.no_str || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">HP</span>
                              <span className="text-xs text-slate-700">{person.no_hp || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">TTL</span>
                              <span className="text-xs text-slate-700">
                                {[person.tempat_lahir, person.tanggal_lahir ? new Date(person.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null].filter(Boolean).join(', ') || '-'}
                              </span>
                            </div>
                            {person.alamat_ktp && (
                              <div className="flex items-start gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-0.5">Alamat</span>
                                <span className="text-xs text-slate-700 leading-relaxed">{person.alamat_ktp}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">MK</span>
                              <span className="text-xs text-slate-700">{person.mata_kuliah || '-'}</span>
                            </div>
                            {person.judul_thesis && (
                              <div className="flex items-start gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-0.5">Thesis</span>
                                <span className="text-xs text-slate-700 leading-relaxed">{person.judul_thesis}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Kuali.</span>
                              <span className="text-xs text-slate-700">{person.kualifikasi || '-'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Checklist - chip style */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumen</span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {Object.values(person.dokumen).filter(Boolean).length}/{Object.keys(person.dokumen).length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(person.dokumen).map((key) => (
                          <div
                            key={key}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold border transition-colors ${
                              person.dokumen[key]
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            {person.dokumen[key] && <Check className="w-2.5 h-2.5" />}
                            {key}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Catatan */}
                    {person.catatan && (
                      <div className="px-5 py-3 border-t border-slate-200/60">
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-600">Catatan</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{person.catatan}</p>
                      </div>
                    )}

                    {/* Timestamp */}
                    {person.updated_at && (
                      <div className="px-5 py-2 border-t border-slate-200/60">
                        <span className="text-xs text-slate-400">
                          Terakhir diubah: {formatUpdatedAt(person.updated_at)}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="p-4 border-t border-slate-200/60 bg-white flex flex-wrap justify-between gap-2">
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
                            onClick={() => setDetailModal({ open: true, personnel: person, sdmType })}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Detail
                          </button>
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

      {/* Personnel Detail Modal */}
      <PersonnelDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal(prev => ({ ...prev, open: false }))}
        personnel={detailModal.personnel}
        sdmType={detailModal.sdmType}
        photoUrl={detailModal.personnel ? photos[`${detailModal.sdmType}_${detailModal.personnel.id}`] || null : null}
      />
    </div>
  );
}

export default DataTable;
