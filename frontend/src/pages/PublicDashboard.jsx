import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getStats, getDosenSarjana, getPembimbingKlinik, getTendik, getPublicPhoto, getPublicFileInfo, BACKEND_URL } from '../api/api';
import { useAuth } from '../context/AuthContext';
import PersonnelDetailModal from '../components/PersonnelDetailModal';
import {
  GraduationCap,
  Stethoscope,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogIn,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';

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

const getSdmTypeKey = (tab) => {
  if (tab === 'klinik') return 'pembimbingKlinik';
  if (tab === 'tendik') return 'tendik';
  return 'dosenTetap';
};

const typeInfoMap = {
  dosenTetap: { name: 'Dosen Tetap', color: 'blue', bgClass: 'from-blue-200 via-blue-100 to-transparent' },
  pembimbingKlinik: { name: 'Pembimbing Klinik', color: 'purple', bgClass: 'from-purple-200 via-purple-100 to-transparent' },
  tendik: { name: 'Tendik & Laboran', color: 'orange', bgClass: 'from-orange-200 via-orange-100 to-transparent' }
};

const colorClassesMap = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' }
};

export default function PublicDashboard({ tab: initialTab }) {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [dosenTetap, setDosenSarjana] = useState([]);
  const [pembimbingKlinik, setPembimbingKlinik] = useState([]);
  const [tendik, setTendik] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const { admin, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState({});
  const [documentFiles, setDocumentFiles] = useState({});
  const [detailModal, setDetailModal] = useState({ open: false, personnel: null, sdmType: null });

  const loadedPhotosRef = useRef(new Set());
  const loadedDocsRef = useRef(new Set());

  // Determine active tab from URL
  const getActiveTab = () => {
    if (initialTab) return initialTab;
    if (location.pathname === '/pembimbing-klinik') return 'klinik';
    if (location.pathname === '/tendik') return 'tendik';
    return 'sarjana';
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    loadData();
  }, []);

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

  // Load document files info
  useEffect(() => {
    const loadDocFiles = async () => {
      try {
        const [dsRes, pkRes, tdRes] = await Promise.all([
          getPublicFileInfo('dosenTetap'),
          getPublicFileInfo('pembimbingKlinik'),
          getPublicFileInfo('tendik')
        ]);
        const filesData = {};
        if (dsRes.data.personnel) dsRes.data.personnel.forEach(p => { filesData[`dosenTetap_${p.id}`] = p.documents; });
        if (pkRes.data.personnel) pkRes.data.personnel.forEach(p => { filesData[`pembimbingKlinik_${p.id}`] = p.documents; });
        if (tdRes.data.personnel) tdRes.data.personnel.forEach(p => { filesData[`tendik_${p.id}`] = p.documents; });
        setDocumentFiles(filesData);
      } catch (err) {
        console.error('Error loading document files:', err);
      }
    };
    loadDocFiles();
  }, []);

  // Load photos when data changes
  useEffect(() => {
    const allData = [...dosenTetap, ...pembimbingKlinik, ...tendik];
    if (allData.length === 0) return;

    const loadPhotos = async () => {
      for (const person of allData) {
        const sdmType = getSdmTypeKey(activeTab === 'klinik' ? 'klinik' : activeTab === 'tendik' ? 'tendik' : 'sarjana');
        const sdmKey = getSdmTypeKey(person.nama ? (dosenTetap.includes(person) ? 'dosenTetap' : pembimbingKlinik.includes(person) ? 'pembimbingKlinik' : 'tendik') : 'dosenTetap');
        const key = `${sdmKey}_${person.id}`;

        // Find actual SDM type for this person
        let actualSdmType = 'dosenTetap';
        if (dosenTetap.some(p => p.id === person.id)) actualSdmType = 'dosenTetap';
        else if (pembimbingKlinik.some(p => p.id === person.id)) actualSdmType = 'pembimbingKlinik';
        else if (tendik.some(p => p.id === person.id)) actualSdmType = 'tendik';

        const actualKey = `${actualSdmType}_${person.id}`;
        if (person.dokumen?.Foto && !loadedPhotosRef.current.has(actualKey)) {
          loadedPhotosRef.current.add(actualKey);
          try {
            const res = await getPublicPhoto(actualSdmType, person.id);
            if (res.data.photoUrl) {
              setPhotos(prev => ({ ...prev, [actualKey]: res.data.photoUrl }));
            }
          } catch (err) {
            console.error('Error loading photo:', err);
          }
        }
      }
    };
    loadPhotos();
  }, [dosenTetap, pembimbingKlinik, tendik]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'sarjana': return dosenTetap;
      case 'klinik': return pembimbingKlinik;
      case 'tendik': return tendik;
      default: return dosenTetap;
    }
  };

  const filteredData = getActiveData().filter(person => {
    const matchSearch = person.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        person.bidang?.toLowerCase().includes(searchTerm.toLowerCase());
    const progress = calculateProgress(person.dokumen);
    const matchFilter = !showOnlyIncomplete || !progress.isComplete;
    return matchSearch && matchFilter;
  });

  const getPersonSdmType = (person) => {
    if (dosenTetap.some(p => p.id === person.id)) return 'dosenTetap';
    if (pembimbingKlinik.some(p => p.id === person.id)) return 'pembimbingKlinik';
    if (tendik.some(p => p.id === person.id)) return 'tendik';
    return 'dosenTetap';
  };

  const getPersonPhoto = (person) => {
    const sdmType = getPersonSdmType(person);
    const key = `${sdmType}_${person.id}`;
    return photos[key] || null;
  };

  const getInitials = (name) => {
    let cleanName = name.replace(/^(dr\.|Dr\.|Hj\.)\s*/i, '');
    return cleanName.substring(0, 2).toUpperCase();
  };

  const handleCardClick = (person, sdmType) => {
    const key = `${sdmType}_${person.id}`;
    setDetailModal({ open: true, personnel: person, sdmType, documentFiles: documentFiles[key] || [] });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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
            <div className="flex items-center gap-3">
              <Link to="/admin" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors">
                Kelola Data
              </Link>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
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
              <span className="text-2xl font-bold text-slate-900">{stats?.dosenTetap?.total || 0}</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Dosen Tetap</h3>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">{stats?.dosenTetap?.complete || 0} Lengkap</span>
              <span className="text-slate-300">|</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600">{stats?.dosenTetap?.incomplete || 0} Perlu Tindakan</span>
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
          <Link to="/dosen-tetap"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sarjana' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            Dosen Tetap ({stats?.dosenTetap?.total || 0})
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showOnlyIncomplete ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}>
            {showOnlyIncomplete ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showOnlyIncomplete ? 'Tampilkan Semua' : 'Belum Lengkap'}
          </button>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((person) => {
            const progress = calculateProgress(person.dokumen);
            const sdmType = getPersonSdmType(person);
            const photoUrl = getPersonPhoto(person);
            return (
              <div
                key={person.id}
                onClick={() => handleCardClick(person, sdmType)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <CircularProgress percentage={progress.percentage} />
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={person.nama}
                        className="absolute w-10 h-10 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className={`absolute w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${progress.isComplete ? 'bg-emerald-50 text-emerald-600' : progress.percentage >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                        {getInitials(person.nama)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-[15px] leading-tight truncate pr-2">{person.nama}</h4>
                    <p className="text-sm text-slate-500 font-medium truncate">{person.bidang || '-'}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${progress.isComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {progress.isComplete ? 'Lengkap' : 'Belum Lengkap'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{progress.completed}/{progress.total} Syarat</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">Tidak ada data yang ditemukan</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Update: {stats?.lastUpdated
              ? new Date(stats.lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Memuat...'}
          </p>
          <p className="mt-1">Fakultas Kedokteran UIN Raden Fatah Palembang</p>
        </div>
      </main>

      {/* Detail Modal */}
      {detailModal.open && detailModal.personnel && (
        <PersonnelDetailModal
          isOpen={detailModal.open}
          personnel={detailModal.personnel}
          sdmType={detailModal.sdmType}
          photoUrl={getPersonPhoto(detailModal.personnel)}
          documentFiles={detailModal.documentFiles || []}
          onClose={() => setDetailModal({ open: false, personnel: null, sdmType: null })}
        />
      )}
    </div>
  );
}
