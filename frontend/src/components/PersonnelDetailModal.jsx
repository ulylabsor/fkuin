import { useEffect, useRef } from 'react';
import { BACKEND_URL } from '../api/api';
import { X, Check, FileText, Award, User, Phone, MapPin, Calendar, BookOpen, GraduationCap, Briefcase, CreditCard, Stethoscope, Users, StickyNote, ExternalLink } from 'lucide-react';

// Mapping folder key (underscore) ke database key (dengan spasi)
const folderKeyToDbKey = {
  'Foto': 'Foto',
  'KTP': 'KTP',
  'Surat_Perjanjian_Dosen_Tetap': 'Surat Perjanjian DT',
  'Surat_Penugasan_Rektor': 'Surat Penugasan Rector',
  'Surat_Pernyataan_EWMP': 'Pernyataan EWMP',
  'CV': 'CV',
  'SIP': 'SIP (opsional)',
  'STR': 'STR',
  'Sertifikat_Pelatihan': 'Sertifikat Pelatihan',
  'Ijazah_S1': 'Ijazah S1',
  'Ijazah_Profesi': 'Ijazah Profesi',
  'Ijazah_S2': 'Ijazah S2',
  'Transkrip_S1': 'Transkrip S1',
  'Transkrip_Profesi': 'Transkrip Profesi',
  'Transkrip_S2': 'Transkrip S2',
  'Surat_Penugasan_Profesor': 'Surat Penugasan',
  'Ijazah_Spesialis': 'Ijazah Spesialis',
  'Sertifikat_Kompetensi': 'Serkam',
  'Ijazah_S1_S2_Profesi': 'Ijazah (S1-S2)',
  'Transkrip_S1_S2_Profesi': 'Transkrip',
  'Ijazah_S1_S2_S3': 'Ijazah',
  'Transkrip_S1_S2_S3': 'Transkrip',
  'Surat_Pernyataan': 'Surat Pernyataan'
};

const dbKeyToFolderKey = Object.fromEntries(
  Object.entries(folderKeyToDbKey).map(([k, v]) => [v, k])
);

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

const getInitials = (name) => {
  if (!name) return '??';
  let cleanName = name.replace(/^(dr\.|Dr\.|Hj\.)\s*/i, '');
  return cleanName.substring(0, 2).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const sdmTypeLabels = {
  dosenTetap: { name: 'Dosen Tetap', icon: GraduationCap, color: 'blue' },
  pembimbingKlinik: { name: 'Pembimbing Klinik', icon: Stethoscope, color: 'purple' },
  tendik: { name: 'Tendik & Laboran', icon: Users, color: 'orange' }
};

// Document keys per SDM type (in display order)
const documentKeysByType = {
  dosenTetap: [
    'Foto', 'KTP', 'Surat Perjanjian DT', 'Surat Penugasan Rector', 'Pernyataan EWMP',
    'CV', 'SIP (opsional)', 'STR', 'Sertifikat Pelatihan', 'Ijazah S1', 'Ijazah Profesi',
    'Ijazah S2', 'Transkrip S1', 'Transkrip Profesi', 'Transkrip S2'
  ],
  pembimbingKlinik: [
    'Foto', 'KTP', 'Surat Penugasan', 'CV', 'STR', 'SIP (opsional)',
    'Ijazah Spesialis', 'Serkam', 'Ijazah (S1-S2)', 'Transkrip'
  ],
  tendik: [
    'Foto', 'KTP', 'Ijazah', 'Transkrip', 'Sertifikat', 'Surat Pernyataan'
  ]
};

const InfoItem = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-2.5 ${className}`}>
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-500" />
    </div>
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">{label}</span>
      <span className="text-sm text-slate-800 font-medium leading-relaxed">{value || '-'}</span>
    </div>
  </div>
);

export default function PersonnelDetailModal({
  isOpen,
  onClose,
  personnel,
  sdmType,
  photoUrl,
  documentFiles = []
}) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus in modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !personnel) return null;

  const progress = calculateProgress(personnel.dokumen);
  const typeInfo = sdmTypeLabels[sdmType] || { name: sdmType, icon: User, color: 'gray' };
  const TypeIcon = typeInfo.icon;
  const docKeys = documentKeysByType[sdmType] || [];

  // Color classes based on type
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', ring: 'ring-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-200' },
    gray: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' }
  }[typeInfo.color] || { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' };

  // Get document URL helper
  const getDocUrl = (dbKey) => {
    const folderKey = dbKeyToFolderKey[dbKey] || dbKey;
    // First try to find in documentFiles
    if (documentFiles.length > 0) {
      const doc = documentFiles.find(f => f.key === folderKey);
      if (doc?.fileUrl) return doc.fileUrl;
    }
    // Fallback: construct URL from filename pattern
    return `${BACKEND_URL}/api/public/file/${sdmType}/${personnel.id}/${folderKey}_`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        style={{ animation: 'modal-enter 0.2s ease-out' }}
      >
        <style>{`
          @keyframes modal-enter {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-in { animation-fill-mode: both; }
        `}</style>

        {/* Header - Gradient */}
        <div className={`relative px-6 py-5 bg-gradient-to-r from-slate-50 to-${typeInfo.color === 'blue' ? 'blue-50' : typeInfo.color === 'purple' ? 'purple-50' : 'orange-50'} border-b border-slate-200`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colorClasses.bg} rounded-xl flex items-center justify-center`}>
              <TypeIcon className={`w-5 h-5 ${colorClasses.text}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detail SDM</p>
              <h2 className="text-lg font-bold text-slate-900">{typeInfo.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Section - 2 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Photo Column */}
            <div className="flex flex-col items-center">
              {/* Decorative Background */}
              <div className={`relative p-1 rounded-3xl bg-gradient-to-br ${typeInfo.color === 'blue' ? 'from-blue-200 via-blue-100 to-transparent' :
                  typeInfo.color === 'purple' ? 'from-purple-200 via-purple-100 to-transparent' :
                    'from-orange-200 via-orange-100 to-transparent'
                }`}>
                {/* Photo Container with Shadow */}
                <div className="relative">
                  {photoUrl ? (
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white">
                      <img
                        src={photoUrl}
                        alt={personnel.nama}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white bg-gradient-to-br ${typeInfo.color === 'blue' ? 'from-blue-400 to-blue-600' :
                        typeInfo.color === 'purple' ? 'from-purple-400 to-purple-600' :
                          'from-orange-400 to-orange-600'
                      } flex items-center justify-center`}>
                      <span className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">{getInitials(personnel.nama)}</span>
                    </div>
                  )}
                  {/* Completion Badge - Positioned nicer */}
                  <div className={`absolute -bottom-3 -right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border-2 border-white ${progress.isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}>
                    {progress.isComplete ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-white" />
                    )}
                    <span className="text-[10px] font-bold text-white">
                      {progress.isComplete ? 'LENGKAP' : `${progress.percentage}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Name with decorative elements */}
              <div className="mt-4 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight break-words">{personnel.nama}</h3>
                <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      typeInfo.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                    }`}>
                    <TypeIcon className="w-3.5 h-3.5 mr-1" />
                    {typeInfo.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Column */}
            <div className="space-y-3">
              {/* Compact Status */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border shadow-sm ${progress.isComplete
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                {progress.isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {progress.isComplete ? 'Lengkap' : `${progress.completed}/${progress.total} Dokumen`}
              </div>

              {/* Catatan if exists */}
              {personnel.catatan && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Catatan</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{personnel.catatan}</p>
                </div>
              )}

              {/* Quick Info Chips */}
              <div className="flex flex-wrap gap-2">
                {personnel.bidang && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                    <Briefcase className="w-3.5 h-3.5" />
                    {personnel.bidang}
                  </span>
                )}
                {personnel.kualifikasi && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    <Award className="w-3.5 h-3.5" />
                    {personnel.kualifikasi}
                  </span>
                )}
                {personnel.no_hp && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    {personnel.no_hp}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-slate-400" />
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Data Diri</h4>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dosen Sarjana Fields */}
                {sdmType === 'dosenTetap' && (
                  <>
                    <InfoItem icon={CreditCard} label="NIK" value={personnel.nik} />
                    <InfoItem icon={FileText} label="No. STR" value={personnel.no_str} />
                    <InfoItem icon={Phone} label="No. HP" value={personnel.no_hp} />
                    <InfoItem icon={Calendar} label="Tempat Lahir" value={personnel.tempat_lahir} />
                    <InfoItem icon={Calendar} label="Tanggal Lahir" value={formatDate(personnel.tanggal_lahir)} />
                    <InfoItem icon={BookOpen} label="Mata Kuliah" value={personnel.mata_kuliah} />
                    <InfoItem icon={MapPin} label="Alamat KTP" value={personnel.alamat_ktp} className="sm:col-span-2" />
                    {personnel.judul_thesis && (
                      <InfoItem icon={BookOpen} label="Judul Thesis" value={personnel.judul_thesis} className="sm:col-span-2" />
                    )}
                  </>
                )}

                {/* Pembimbing Klinik Fields */}
                {sdmType === 'pembimbingKlinik' && (
                  <>
                    <InfoItem icon={FileText} label="No. STR" value={personnel.no_str} />
                    <InfoItem icon={FileText} label="SIP" value={personnel.sip} />
                    <InfoItem icon={Phone} label="No. HP" value={personnel.no_hp} />
                    <InfoItem icon={MapPin} label="Alamat KTP" value={personnel.alamat_ktp} />
                  </>
                )}

                {/* Tendik Fields */}
                {sdmType === 'tendik' && (
                  <>
                    <InfoItem icon={Phone} label="No. HP" value={personnel.no_hp} />
                    <InfoItem icon={MapPin} label="Alamat KTP" value={personnel.alamat_ktp} />
                  </>
                )}

                {/* Common fields */}
                <InfoItem icon={Briefcase} label="Bidang" value={personnel.bidang} />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Daftar Dokumen</h4>
              <span className="text-xs text-slate-400 ml-auto">
                {progress.completed}/{progress.total}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-1.5">
                {docKeys.map((key) => {
                  const hasFile = !!personnel.dokumen?.[key];
                  return hasFile ? (
                    <a
                      key={key}
                      href={getDocUrl(key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-sm cursor-pointer"
                      title={`Klik untuk melihat ${key}`}
                    >
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                      <span className="flex-1">{key}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <div
                      key={key}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-white text-slate-400 border-slate-200"
                    >
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      </span>
                      {key}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          {personnel.updated_at && (
            <div className="mt-4 text-center">
              <span className="text-xs text-slate-400">
                Terakhir diubah: {new Date(personnel.updated_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
