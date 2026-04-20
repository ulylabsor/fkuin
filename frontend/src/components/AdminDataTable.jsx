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
  X,
  Save,
  FileText,
  Edit2,
  ExternalLink
} from 'lucide-react';
import DocumentModal from './DocumentModal';
import PersonnelDetailModal from './PersonnelDetailModal';
import { getPhoto, getDocumentsAdmin, getPublicFileInfo } from '../api/api';

// Mapping key database ke folder key
const dbToFolderKey = {
  'Foto': 'Foto',
  'KTP': 'KTP',
  'Surat Perjanjian DT': 'Surat_Perjanjian_Dosen_Tetap',
  'Surat Penugasan Rector': 'Surat_Penugasan_Rektor',
  'Surat Penugasan': 'Surat_Penugasan_Rektor',
  'Pernyataan EWMP': 'Surat_Pernyataan_EWMP',
  'CV': 'CV',
  'SIP': 'SIP',
  'STR': 'STR',
  'Sertifikat Pelatihan': 'Sertifikat_Pelatihan',
  'Ijazah S1': 'Ijazah_S1',
  'Ijazah Profesi': 'Ijazah_Profesi',
  'Ijazah S2': 'Ijazah_S2',
  'Transkrip S1': 'Transkrip_S1',
  'Transkrip Profesi': 'Transkrip_Profesi',
  'Transkrip S2': 'Transkrip_S2',
  'Ijazah Spesialis': 'Ijazah_Spesialis',
  'Serkam': 'Sertifikat_Kompetensi',
  'Ijazah (S1-S2)': 'Ijazah_S1_S2_Profesi',
  'Transkrip': 'Transkrip_S1_S2_Profesi',
  'Ijazah': 'Ijazah_S1_S2_S3',
  'Surat Pernyataan': 'Surat_Pernyataan'
};

// Urutan dokumen sesuai dengan modal upload
const documentOrder = {
  dosenTetap: [
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

export default function AdminDataTable({
  title,
  description,
  data,
  loading,
  onRefresh,
  onAdd,
  onDelete,
  sdmType,
  onUpdateCatatan
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [newPerson, setNewPerson] = useState({
    nama: '', nik: '', no_str: '', no_hp: '', alamat_ktp: '',
    tempat_lahir: '', tanggal_lahir: '', mata_kuliah: '', judul_thesis: '',
    bidang: '', kualifikasi: '', sip: ''
  });
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editFields, setEditFields] = useState(null);
  const [editingCatatanId, setEditingCatatanId] = useState(null);
  const [catatanValue, setCatatanValue] = useState('');
  const [documentModal, setDocumentModal] = useState({
    open: false,
    personnelId: null,
    personnelName: ''
  });
  const [detailModal, setDetailModal] = useState({ open: false, personnel: null });
  const [documentFiles, setDocumentFiles] = useState({});
  const [photos, setPhotos] = useState({});

  // Stagger animation delay per card index
  const getCardDelay = (index) => `${Math.min(index * 40, 600)}ms`;

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

  // Load document files for modal
  useEffect(() => {
    const loadDocFiles = async () => {
      try {
        const res = await getPublicFileInfo(sdmType);
        const filesData = {};
        if (res.data.personnel) {
          res.data.personnel.forEach(p => {
            filesData[`${sdmType}_${p.id}`] = p.documents;
          });
        }
        setDocumentFiles(filesData);
      } catch (err) {
        console.error('Error loading document files:', err);
      }
    };
    loadDocFiles();
  }, [sdmType]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Open document in new tab
  const openDocument = async (person, docKey) => {
    // Check if document is marked as uploaded in database
    if (!person.dokumen || !person.dokumen[docKey]) {
      showToast('Dokumen belum diunggah', 'warning');
      return;
    }

    // Map database key to folder key
    const folderKey = dbToFolderKey[docKey] || docKey;

    try {
      const res = await getDocumentsAdmin(sdmType, person.id);
      const doc = res.data.documents.find(d => d.key === folderKey);
      if (doc && doc.file?.filename) {
        const fileUrl = `/api/public/file/${sdmType}/${person.id}/${doc.file.filename}`;
        window.open(fileUrl, '_blank');
      } else {
        showToast('File tidak ditemukan di server', 'warning');
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      showToast('Gagal membuka dokumen', 'error');
    }
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
      setNewPerson({ nama: '', nik: '', no_str: '', no_hp: '', alamat_ktp: '', tempat_lahir: '', tanggal_lahir: '', mata_kuliah: '', judul_thesis: '', bidang: '', kualifikasi: '', sip: '' });
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

  const startEditFields = (person) => {
    setEditMode(person.id);
    if (sdmType === 'dosenTetap') {
      setEditFields({
        nama: person.nama || '', bidang: person.bidang || '', kualifikasi: person.kualifikasi || '',
        nik: person.nik || '', no_str: person.no_str || '', no_hp: person.no_hp || '',
        tempat_lahir: person.tempat_lahir || '', tanggal_lahir: person.tanggal_lahir || '',
        alamat_ktp: person.alamat_ktp || '', mata_kuliah: person.mata_kuliah || '', judul_thesis: person.judul_thesis || ''
      });
    } else if (sdmType === 'pembimbingKlinik') {
      setEditFields({
        nama: person.nama || '', bidang: person.bidang || '', kualifikasi: person.kualifikasi || '',
        no_str: person.no_str || '', no_hp: person.no_hp || '', alamat_ktp: person.alamat_ktp || '', sip: person.sip || ''
      });
    } else {
      setEditFields({
        nama: person.nama || '', bidang: person.bidang || '', kualifikasi: person.kualifikasi || '',
        no_hp: person.no_hp || '', alamat_ktp: person.alamat_ktp || ''
      });
    }
  };

  const saveEditFields = async (id) => {
    try {
      const person = data.find(p => p.id === id);
      const updated = { ...person, ...editFields };
      delete updated.dokumen;
      delete updated.catatan;
      delete updated.created_at;
      delete updated.updated_at;
      const apiMap = { dosenTetap: 'updateDosenSarjana', pembimbingKlinik: 'updatePembimbingKlinik', tendik: 'updateTendik' };
      const apiFn = apiMap[sdmType];
      const api = await import('../api/api');
      await api[apiFn](id, { ...updated, catatan: person.catatan });
      setEditMode(null);
      setEditFields(null);
      showToast('Data berhasil diperbarui!', 'success');
      onRefresh();
    } catch (err) {
      console.error('Error saving:', err);
      showToast('Gagal menyimpan data', 'error');
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
      <style>{`
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-animate {
          animation: card-enter 0.35s ease-out both;
        }
      `}</style>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Semua tipe: Nama */}
              <input
                type="text" placeholder="Nama Lengkap *"
                value={newPerson.nama}
                onChange={(e) => setNewPerson({ ...newPerson, nama: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <input
                type="text" placeholder="Bidang"
                value={newPerson.bidang}
                onChange={(e) => setNewPerson({ ...newPerson, bidang: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <input
                type="text" placeholder="Kualifikasi"
                value={newPerson.kualifikasi}
                onChange={(e) => setNewPerson({ ...newPerson, kualifikasi: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              {/* Dosen Tetap */}
              {sdmType === 'dosenTetap' && (
                <>
                  <input type="text" placeholder="NIK" value={newPerson.nik} onChange={(e) => setNewPerson({ ...newPerson, nik: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="No. STR" value={newPerson.no_str} onChange={(e) => setNewPerson({ ...newPerson, no_str: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="No. HP" value={newPerson.no_hp} onChange={(e) => setNewPerson({ ...newPerson, no_hp: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="Tempat Lahir" value={newPerson.tempat_lahir} onChange={(e) => setNewPerson({ ...newPerson, tempat_lahir: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="date" placeholder="Tanggal Lahir" value={newPerson.tanggal_lahir} onChange={(e) => setNewPerson({ ...newPerson, tanggal_lahir: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="Alamat KTP" value={newPerson.alamat_ktp} onChange={(e) => setNewPerson({ ...newPerson, alamat_ktp: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="Mata Kuliah" value={newPerson.mata_kuliah} onChange={(e) => setNewPerson({ ...newPerson, mata_kuliah: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="Judul Thesis (opsional)" value={newPerson.judul_thesis} onChange={(e) => setNewPerson({ ...newPerson, judul_thesis: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </>
              )}

              {/* Pembimbing Klinik */}
              {sdmType === 'pembimbingKlinik' && (
                <>
                  <input type="text" placeholder="No. STR" value={newPerson.no_str} onChange={(e) => setNewPerson({ ...newPerson, no_str: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="SIP" value={newPerson.sip} onChange={(e) => setNewPerson({ ...newPerson, sip: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="No. HP" value={newPerson.no_hp} onChange={(e) => setNewPerson({ ...newPerson, no_hp: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="Alamat KTP" value={newPerson.alamat_ktp} onChange={(e) => setNewPerson({ ...newPerson, alamat_ktp: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </>
              )}

              {/* Tendik */}
              {sdmType === 'tendik' && (
                <>
                  <input type="text" placeholder="No. HP" value={newPerson.no_hp} onChange={(e) => setNewPerson({ ...newPerson, no_hp: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <input type="text" placeholder="Alamat KTP" value={newPerson.alamat_ktp} onChange={(e) => setNewPerson({ ...newPerson, alamat_ktp: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </>
              )}
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
                onClick={() => { setShowForm(false); setNewPerson({ nama: '', nik: '', no_str: '', no_hp: '', alamat_ktp: '', tempat_lahir: '', tanggal_lahir: '', mata_kuliah: '', judul_thesis: '', bidang: '', kualifikasi: '' }); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Data Grid */}
        {filteredData.length > 0 ? (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-5">
            {filteredData.map((person) => {
              const progress = calculateProgress(person.dokumen);
              const isExpanded = expandedId === person.id;

              const hasCatatan = !!person.catatan;

              const toggleExpand = (e) => {
                e.stopPropagation();
                setExpandedId((prev) => (prev === person.id ? null : person.id));
              };

              return (
                <div
                  key={person.id}
                  className={`break-inside-avoid rounded-2xl border-2 flex flex-col transition-all duration-200 mb-5 card-animate ${
                    isExpanded
                      ? 'border-slate-300 shadow-lg'
                      : hasCatatan
                      ? 'border-amber-300 shadow-sm bg-amber-50/30'
                      : 'border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                  style={{ animationDelay: getCardDelay(filteredData.indexOf(person)) }}
                >
                  {/* Header */}
                  <div
                    className="p-5 cursor-pointer select-none"
                    onClick={toggleExpand}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModal({ open: true, personnel: person });
                        }}>
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
                        {sdmType === 'dosenTetap' && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {person.nik && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                NIK: {person.nik}
                              </span>
                            )}
                            {person.no_hp && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                HP: {person.no_hp}
                              </span>
                            )}
                            {person.mata_kuliah && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-semibold truncate max-w-[180px]">
                                {person.mata_kuliah}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            progress.isComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {progress.isComplete ? 'Lengkap' : 'Belum Lengkap'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{progress.completed}/{progress.total} Syarat</span>
                          {hasCatatan && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              <FileText className="w-3 h-3" />
                              Ada Catatan
                            </span>
                          )}
                          {person.updated_at && (
                            <span className="text-xs text-slate-400 ml-auto">Diubah {formatUpdatedAt(person.updated_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-white rounded-b-2xl border-t border-slate-200">
                      {sdmType === 'dosenTetap' && (
                        <div className="px-5 pt-4 pb-3 space-y-2 border-b border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Diri</span>
                            {!editMode && (
                              <button onClick={() => startEditFields(person)}
                                className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                            )}
                          </div>
                          {editMode === person.id ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Nama</span>
                                <input value={editFields?.nama || ''} onChange={(e) => setEditFields(p => ({ ...p, nama: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Bidang</span>
                                <input value={editFields?.bidang || ''} onChange={(e) => setEditFields(p => ({ ...p, bidang: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Kuali.</span>
                                <input value={editFields?.kualifikasi || ''} onChange={(e) => setEditFields(p => ({ ...p, kualifikasi: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">NIK</span>
                                <input value={editFields?.nik || ''} onChange={(e) => setEditFields(p => ({ ...p, nik: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">STR</span>
                                <input value={editFields?.no_str || ''} onChange={(e) => setEditFields(p => ({ ...p, no_str: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">HP</span>
                                <input value={editFields?.no_hp || ''} onChange={(e) => setEditFields(p => ({ ...p, no_hp: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">T.Lahir</span>
                                <input value={editFields?.tempat_lahir || ''} onChange={(e) => setEditFields(p => ({ ...p, tempat_lahir: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Tgl.Lhr</span>
                                <input type="date" value={editFields?.tanggal_lahir || ''} onChange={(e) => setEditFields(p => ({ ...p, tanggal_lahir: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-1">Alamat</span>
                                <textarea value={editFields?.alamat_ktp || ''} onChange={(e) => setEditFields(p => ({ ...p, alamat_ktp: e.target.value }))}
                                  rows="2"
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">MK</span>
                                <input value={editFields?.mata_kuliah || ''} onChange={(e) => setEditFields(p => ({ ...p, mata_kuliah: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-1">Thesis</span>
                                <textarea value={editFields?.judul_thesis || ''} onChange={(e) => setEditFields(p => ({ ...p, judul_thesis: e.target.value }))}
                                  rows="2"
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none" />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => saveEditFields(person.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                  Simpan
                                </button>
                                <button onClick={() => setEditMode(null)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                                  Batal
                                </button>
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

                      {/* Pembimbing Klinik */}
                      {sdmType === 'pembimbingKlinik' && (
                        <div className="px-5 pt-4 pb-3 space-y-2 border-b border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Diri</span>
                            {editMode !== person.id && (
                              <button onClick={() => startEditFields(person)}
                                className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                            )}
                          </div>
                          {editMode === person.id ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Nama</span>
                                <input value={editFields?.nama || ''} onChange={(e) => setEditFields(p => ({ ...p, nama: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Bidang</span>
                                <input value={editFields?.bidang || ''} onChange={(e) => setEditFields(p => ({ ...p, bidang: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Kuali.</span>
                                <input value={editFields?.kualifikasi || ''} onChange={(e) => setEditFields(p => ({ ...p, kualifikasi: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">STR</span>
                                <input value={editFields?.no_str || ''} onChange={(e) => setEditFields(p => ({ ...p, no_str: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">SIP</span>
                                <input value={editFields?.sip || ''} onChange={(e) => setEditFields(p => ({ ...p, sip: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">HP</span>
                                <input value={editFields?.no_hp || ''} onChange={(e) => setEditFields(p => ({ ...p, no_hp: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-1">Alamat</span>
                                <textarea value={editFields?.alamat_ktp || ''} onChange={(e) => setEditFields(p => ({ ...p, alamat_ktp: e.target.value }))}
                                  rows="2"
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none" />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => saveEditFields(person.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                  Simpan
                                </button>
                                <button onClick={() => setEditMode(null)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                                  Batal
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Kuali.</span>
                                <span className="text-xs text-slate-700">{person.kualifikasi || '-'}</span>
                              </div>
                              {person.no_str && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">STR</span>
                                  <span className="text-xs text-slate-700">{person.no_str}</span>
                                </div>
                              )}
                              {person.sip && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">SIP</span>
                                  <span className="text-xs text-slate-700">{person.sip}</span>
                                </div>
                              )}
                              {person.no_hp && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">HP</span>
                                  <span className="text-xs text-slate-700">{person.no_hp}</span>
                                </div>
                              )}
                              {person.alamat_ktp && (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-0.5">Alamat</span>
                                  <span className="text-xs text-slate-700 leading-relaxed">{person.alamat_ktp}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Tendik */}
                      {sdmType === 'tendik' && (
                        <div className="px-5 pt-4 pb-3 space-y-2 border-b border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Diri</span>
                            {editMode !== person.id && (
                              <button onClick={() => startEditFields(person)}
                                className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                            )}
                          </div>
                          {editMode === person.id ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Nama</span>
                                <input value={editFields?.nama || ''} onChange={(e) => setEditFields(p => ({ ...p, nama: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Bidang</span>
                                <input value={editFields?.bidang || ''} onChange={(e) => setEditFields(p => ({ ...p, bidang: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Kuali.</span>
                                <input value={editFields?.kualifikasi || ''} onChange={(e) => setEditFields(p => ({ ...p, kualifikasi: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">HP</span>
                                <input value={editFields?.no_hp || ''} onChange={(e) => setEditFields(p => ({ ...p, no_hp: e.target.value }))}
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-1">Alamat</span>
                                <textarea value={editFields?.alamat_ktp || ''} onChange={(e) => setEditFields(p => ({ ...p, alamat_ktp: e.target.value }))}
                                  rows="2"
                                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none" />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => saveEditFields(person.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                  Simpan
                                </button>
                                <button onClick={() => setEditMode(null)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                                  Batal
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">Kuali.</span>
                                <span className="text-xs text-slate-700">{person.kualifikasi || '-'}</span>
                              </div>
                              {person.no_hp && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">HP</span>
                                  <span className="text-xs text-slate-700">{person.no_hp}</span>
                                </div>
                              )}
                              {person.alamat_ktp && (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14 mt-0.5">Alamat</span>
                                  <span className="text-xs text-slate-700 leading-relaxed">{person.alamat_ktp}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      <div className="px-5 py-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-600">Catatan</span>
                          </div>
                          {editingCatatanId !== person.id && (
                            <button
                              onClick={() => { setEditingCatatanId(person.id); setCatatanValue(person.catatan || ''); }}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              {person.catatan ? 'Edit' : 'Tambah'}
                            </button>
                          )}
                        </div>
                        {editingCatatanId === person.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={catatanValue}
                              onChange={(e) => setCatatanValue(e.target.value)}
                              rows={3}
                              placeholder="Tambahkan catatan tentang personel ini..."
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await onUpdateCatatan(person.id, catatanValue);
                                    setEditingCatatanId(null);
                                    showToast('Catatan berhasil disimpan', 'success');
                                    onRefresh();
                                  } catch {
                                    showToast('Gagal menyimpan catatan', 'error');
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                              >Simpan</button>
                              <button
                                onClick={() => setEditingCatatanId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              >Batal</button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm ${person.catatan ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                            {person.catatan || 'Belum ada catatan'}
                          </p>
                        )}
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
                                {person.dokumen[key] ? (
                                  <button
                                    onClick={() => openDocument(person, key)}
                                    className="text-xs text-emerald-600 font-medium hover:text-emerald-800 hover:underline flex items-center gap-1"
                                    title={`Klik untuk melihat ${key}`}
                                  >
                                    {key}
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">{key}</span>
                                )}
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

      {/* Personnel Detail Modal */}
      <PersonnelDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal(prev => ({ ...prev, open: false }))}
        personnel={detailModal.personnel}
        sdmType={sdmType}
        photoUrl={detailModal.personnel ? photos[detailModal.personnel.id] || null : null}
        documentFiles={detailModal.personnel ? documentFiles[`${sdmType}_${detailModal.personnel.id}`] || [] : []}
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
