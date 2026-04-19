// Konfigurasi dokumen per jenis SDM

const dokumenConfig = {
  dosenSarjana: {
    tableName: 'dosen_sarjana',
    folder: 'dosen-sarjana',
    documents: [
      { key: 'Foto', label: 'Foto', extensions: ['jpg', 'jpeg', 'png'], maxSize: 2, required: true },
      { key: 'KTP', label: 'KTP', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 5, required: true },
      { key: 'Surat_Perjanjian_Dosen_Tetap', label: 'Surat Perjanjian Dosen Tetap', extensions: ['pdf'], maxSize: 10, required: true },
      { key: 'Surat_Penugasan_Rektor', label: 'Surat Penugasan Rektor', extensions: ['pdf'], maxSize: 10, required: true },
      { key: 'Surat_Pernyataan_EWMP', label: 'Surat Pernyataan Kesediaan EWMP', extensions: ['pdf'], maxSize: 5, required: true },
      { key: 'CV', label: 'CV', extensions: ['pdf'], maxSize: 5, required: true },
      { key: 'SIP', label: 'SIP (opsional)', extensions: ['pdf'], maxSize: 5, required: false },
      { key: 'STR', label: 'STR', extensions: ['pdf'], maxSize: 5, required: true },
      { key: 'Sertifikat_Pelatihan', label: 'Sertifikat Pelatihan/Kelulusan', extensions: ['pdf'], maxSize: 10, required: true },
      { key: 'Ijazah_S1', label: 'Ijazah S1', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 10, required: true },
      { key: 'Ijazah_Profesi', label: 'Ijazah Profesi', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 10, required: true },
      { key: 'Ijazah_S2', label: 'Ijazah S2', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 10, required: true },
      { key: 'Transkrip_S1', label: 'Transkrip S1', extensions: ['pdf'], maxSize: 10, required: true },
      { key: 'Transkrip_Profesi', label: 'Transkrip Profesi', extensions: ['pdf'], maxSize: 10, required: true },
      { key: 'Transkrip_S2', label: 'Transkrip S2', extensions: ['pdf'], maxSize: 10, required: true }
    ]
  },
  pembimbingKlinik: {
    tableName: 'pembimbing_klinik',
    folder: 'pembimbing-klinik',
    documents: [
      { key: 'Foto', label: 'Foto', extensions: ['jpg', 'jpeg', 'png'], maxSize: 2, required: true },
      { key: 'KTP', label: 'KTP', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 5, required: true },
      { key: 'Surat_Penugasan_Rektor', label: 'Surat Penugasan Profesor', extensions: ['pdf'], maxSize: 10, required: true },
      { key: 'CV', label: 'CV', extensions: ['pdf'], maxSize: 5, required: true },
      { key: 'STR', label: 'STR', extensions: ['pdf'], maxSize: 5, required: true },
      { key: 'SIP', label: 'SIP', extensions: ['pdf'], maxSize: 5, required: true },
      { key: 'Ijazah_Spesialis', label: 'Ijazah Spesialis', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 10, required: true },
      { key: 'Sertifikat_Kompetensi', label: 'Sertifikat Kompetensi', extensions: ['pdf'], maxSize: 10, required: true },
      { key: 'Ijazah_S1_S2_Profesi', label: 'Ijazah S1-S2, Profesi', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 10, required: true },
      { key: 'Transkrip_S1_S2_Profesi', label: 'Transkrip S1-S2, Profesi', extensions: ['pdf'], maxSize: 10, required: true }
    ]
  },
  tendik: {
    tableName: 'tendik',
    folder: 'tendik',
    documents: [
      { key: 'Foto', label: 'Foto', extensions: ['jpg', 'jpeg', 'png'], maxSize: 2, required: true },
      { key: 'KTP', label: 'KTP', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 5, required: true },
      { key: 'Ijazah_S1_S2_S3', label: 'Ijazah S1-S2, S3 jika ada', extensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSize: 10, required: false },
      { key: 'Transkrip_S1_S2_S3', label: 'Transkrip S1-S2, S3 jika ada', extensions: ['pdf'], maxSize: 10, required: false },
      { key: 'Sertifikat_Kompetensi', label: 'Sertifikat Kompetensi (jika ada)', extensions: ['pdf'], maxSize: 10, required: false },
      { key: 'Surat_Pernyataan', label: 'Surat Pernyataan Kesediaan Bekerja Penuh Waktu', extensions: ['pdf'], maxSize: 5, required: true }
    ]
  }
};

// Convert key dengan spasi ke format folder-safe
const toFolderKey = (key) => key.replace(/[^a-zA-Z0-9]/g, '_');

// Convert format folder-safe ke key tampilan
const toDisplayKey = (folderKey) => folderKey.replace(/_/g, ' ');

// Convert folder key kembali ke key original di database
const toOriginalKey = (folderKey) => {
  // Map folder key ke original key yang ada di database
  const mappings = {
    'Foto': 'Foto',
    'KTP': 'KTP',
    'Surat_Perjanjian_Dosen_Tetap': 'Surat Perjanjian DT',
    'Surat_Penugasan_Rektor': 'Surat Penugasan Rector',
    'Surat_Pernyataan_EWMP': 'Pernyataan EWMP',
    'CV': 'CV',
    'SIP': 'SIP',
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
  return mappings[folderKey] || folderKey.replace(/_/g, ' ');
};

// Get SDM type dari table name
const getSdmTypeFromTable = (tableName) => {
  const mapping = {
    'dosen_sarjana': 'dosenSarjana',
    'pembimbing_klinik': 'pembimbingKlinik',
    'tendik': 'tendik'
  };
  return mapping[tableName] || null;
};

module.exports = {
  dokumenConfig,
  toFolderKey,
  toDisplayKey,
  toOriginalKey,
  getSdmTypeFromTable
};
