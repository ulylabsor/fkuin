import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Stethoscope,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogIn,
  Eye,
  EyeOff,
  Search,
  FileText,
  Award,
  Check
} from 'lucide-react';
import { getStats, getDosenSarjana, getPembimbingKlinik, getTendik, getPublicPhoto, getPublicDocumentKeys, getPublicFileInfo } from '../api/api';

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

const getInitials = (name) => {
  let cleanName = name.replace(/^(dr\.|Dr\.|Hj\.)\s*/i, '');
  return cleanName.substring(0, 2).toUpperCase();
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

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [stats, setStats] = useState(null);
  const [dosenSarjana, setDosenSarjana] = useState([]);
  const [pembimbingKlinik, setPembimbingKlinik] = useState([]);
  const [tendik, setTendik] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [photos, setPhotos] = useState({});
  const [documentKeys, setDocumentKeys] = useState({});
  const [documentFiles, setDocumentFiles] = useState({});

  const getFileUrl = (sdmType, personId, docKey) => {
    const key = `${sdmType}_${personId}`;
    const files = documentFiles[key];
    if (!files) return null;
    const doc = files.find(f => f.key === docKey);
    return doc?.fileUrl || null;
  };

  // Load document files info
  useEffect(() => {
    const loadDocFiles = async () => {
      try {
        const [dsRes, pkRes, tdRes] = await Promise.all([
          getPublicFileInfo('dosenSarjana'),
          getPublicFileInfo('pembimbingKlinik'),
          getPublicFileInfo('tendik')
        ]);
        const filesData = {};
        if (dsRes.data.personnel) dsRes.data.personnel.forEach(p => { filesData[`dosenSarjana_${p.id}`] = p.documents; });
        if (pkRes.data.personnel) pkRes.data.personnel.forEach(p => { filesData[`pembimbingKlinik_${p.id}`] = p.documents; });
        if (tdRes.data.personnel) tdRes.data.personnel.forEach(p => { filesData[`tendik_${p.id}`] = p.documents; });
        setDocumentFiles(filesData);
      } catch (err) {
        console.error('Error loading document files:', err);
      }
    };
    loadDocFiles();
  }, []);

  // Stagger animation delay per card index
  const getCardDelay = (index) => `${Math.min(index * 40, 600)}ms`;

  const getActiveTab = () => {
    if (location.pathname === '/pembimbing-klinik') return 'klinik';
    if (location.pathname === '/tendik') return 'tendik';
    return 'sarjana';
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    loadData();
    loadDocumentKeys();
  }, []);

  const loadDocumentKeys = async () => {
    try {
      const [dsRes, pkRes, tdRes] = await Promise.all([
        getPublicDocumentKeys('dosenSarjana'),
        getPublicDocumentKeys('pembimbingKlinik'),
        getPublicDocumentKeys('tendik')
      ]);
      setDocumentKeys({
        dosenSarjana: dsRes.data.documents,
        pembimbingKlinik: pkRes.data.documents,
        tendik: tdRes.data.documents
      });
    } catch (err) {
      console.error('Error loading document keys:', err);
    }
  };

  // Load photos
  useEffect(() => {
    if (dosenSarjana.length > 0 || pembimbingKlinik.length > 0 || tendik.length > 0) {
      const loadPhotos = async () => {
        // Load for Dosen Sarjana
        for (const person of dosenSarjana) {
          const key = `dosenSarjana_${person.id}`;
          if (person.dokumen?.Foto && !photos[key]) {
            try {
              const res = await getPublicPhoto('dosenSarjana', person.id);
              if (res.data.photoUrl) {
                setPhotos(prev => ({ ...prev, [key]: res.data.photoUrl }));
              }
            } catch (err) {
              console.error('Error loading photo:', err);
            }
          }
        }
        // Load for Pembimbing Klinik
        for (const person of pembimbingKlinik) {
          const key = `pembimbingKlinik_${person.id}`;
          if (person.dokumen?.Foto && !photos[key]) {
            try {
              const res = await getPublicPhoto('pembimbingKlinik', person.id);
              if (res.data.photoUrl) {
                setPhotos(prev => ({ ...prev, [key]: res.data.photoUrl }));
              }
            } catch (err) {
              console.error('Error loading photo:', err);
            }
          }
        }
        // Load for Tendik
        for (const person of tendik) {
          const key = `tendik_${person.id}`;
          if (person.dokumen?.Foto && !photos[key]) {
            try {
              const res = await getPublicPhoto('tendik', person.id);
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
  }, [dosenSarjana, pembimbingKlinik, tendik]);

  const loadData = async () => {
    try {
      const [statsRes, dsRes, pkRes, tdRes] = await Promise.all([
        getStats(),
        getDosenSarjana(),
        getPembimbingKlinik(),
        getTendik()
      ]);
      setStats(statsRes.data);
      setDosenSarjana(dsRes.data);
      setPembimbingKlinik(pkRes.data);
      setTendik(tdRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => navigate('/login');

  const getActiveData = () => {
    switch (activeTab) {
      case 'sarjana': return dosenSarjana;
      case 'klinik': return pembimbingKlinik;
      case 'tendik': return tendik;
      default: return dosenSarjana;
    }
  };

  const filteredData = getActiveData().filter(person => {
    const matchSearch = person.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        person.bidang?.toLowerCase().includes(searchTerm.toLowerCase());
    const progress = calculateProgress(person.dokumen);
    const matchFilter = !showOnlyIncomplete || !progress.isComplete;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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
      <header className="sticky top-0 z-20 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">SDM FK UIN Raden Fatah</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Dashboard Publik</p>
            </div>
          </div>

          {isAuthenticated ? (
            <Link to="/admin" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors">
              Kelola Data
            </Link>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors">
              <LogIn className="w-4 h-4" />
              Login Admin
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats?.dosenSarjana?.total || 0}</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Dosen Sarjana</h3>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">{stats?.dosenSarjana?.complete || 0} Lengkap</span>
              <span className="text-slate-300">|</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600">{stats?.dosenSarjana?.incomplete || 0} Perlu Tindakan</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats?.pembimbingKlinik?.total || 0}</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Pembimbing Klinik</h3>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">{stats?.pembimbingKlinik?.complete || 0} Lengkap</span>
              <span className="text-slate-300">|</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600">{stats?.pembimbingKlinik?.incomplete || 0} Perlu Tindakan</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats?.tendik?.total || 0}</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Tendik & Laboran</h3>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">{stats?.tendik?.complete || 0} Lengkap</span>
              <span className="text-slate-300">|</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600">{stats?.tendik?.incomplete || 0} Perlu Tindakan</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-slate-200 w-max">
          <Link to="/dosen-sarjana"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sarjana' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            Dosen Sarjana ({stats?.dosenSarjana?.total || 0})
          </Link>
          <Link to="/pembimbing-klinik"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'klinik' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            Pembimbing Klinik ({stats?.pembimbingKlinik?.total || 0})
          </Link>
          <Link to="/tendik"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tendik' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            Tendik & Laboran ({stats?.tendik?.total || 0})
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input type="text" placeholder="Cari nama atau bidang..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button onClick={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showOnlyIncomplete ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}>
            {showOnlyIncomplete ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showOnlyIncomplete ? 'Tampilkan Semua' : 'Belum Lengkap'}
          </button>
        </div>

        {/* Data Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
          {filteredData.map((person) => {
            const progress = calculateProgress(person.dokumen);
            const isExpanded = expandedId === person.id;
            const photoKey = `${activeTab === 'sarjana' ? 'dosenSarjana' : activeTab === 'klinik' ? 'pembimbingKlinik' : 'tendik'}_${person.id}`;
            const hasCatatan = !!person.catatan;
            const toggleExpand = (e) => {
              e.stopPropagation();
              setExpandedId((prev) => (prev === person.id ? null : person.id));
            };

            return (
              <div key={person.id}
                className={`break-inside-avoid rounded-2xl border-2 shadow-sm p-5 cursor-pointer transition-all duration-200 mb-5 card-animate ${
                  isExpanded
                    ? 'border-emerald-400 shadow-lg ring-2 ring-emerald-200 bg-white'
                    : hasCatatan
                    ? 'border-amber-300 bg-amber-50/30 hover:shadow-md'
                    : 'border-slate-200 bg-white hover:shadow-md hover:border-slate-300'
                }`}
                onClick={toggleExpand}
                style={{ animationDelay: getCardDelay(filteredData.indexOf(person)) }}>
                <div className="flex items-start gap-4">
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
                      className={`absolute w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${progress.isComplete ? 'bg-emerald-50 text-emerald-600' : progress.percentage >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}
                      style={photos[photoKey] ? { display: 'none' } : {}}
                    >
                      {getInitials(person.nama)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-[15px] leading-tight truncate pr-2">{person.nama}</h4>
                    <p className="text-sm text-slate-500 font-medium truncate">{person.bidang || '-'}</p>
                    {activeTab === 'sarjana' && (
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${progress.isComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
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
                        <span className="text-xs text-slate-400 ml-auto">
                          {formatUpdatedAt(person.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {activeTab === 'sarjana' && (
                      <div className="space-y-1.5">
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
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumen</span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {Object.values(person.dokumen || {}).filter(Boolean).length}/
                          {Object.keys(person.dokumen || {}).length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(documentKeys[activeTab === 'sarjana' ? 'dosenSarjana' : activeTab === 'klinik' ? 'pembimbingKlinik' : 'tendik'] || []).map((doc) => {
                          const value = person.dokumen[doc.label] || person.dokumen[doc.key];
                          const fileUrl = getFileUrl(activeTab === 'sarjana' ? 'dosenSarjana' : activeTab === 'klinik' ? 'pembimbingKlinik' : 'tendik', person.id, doc.key);
                          return value && fileUrl ? (
                            <a
                              key={doc.key}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold border transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              title={`Klik untuk melihat ${doc.label}`}
                            >
                              <Check className="w-2.5 h-2.5" />
                              {doc.label}
                            </a>
                          ) : (
                            <span
                              key={doc.key}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold border bg-white text-slate-400 border-slate-200"
                            >
                              <span className="w-2.5 h-2.5 inline-block" />
                              {doc.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    {person.catatan && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-600">Catatan</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{person.catatan}</p>
                      </div>
                    )}
                    {person.updated_at && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400">
                          Terakhir diubah: {formatUpdatedAt(person.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">Tidak ada data yang ditemukan</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Periode: Tahun Akademik 2026/2027 | Fakultas Kedokteran UIN Raden Fatah Palembang</p>
        </div>
      </main>
    </div>
  );
}
