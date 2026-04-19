const pool = require('../config/database');

const docSarjanaLengkap = {
  "Foto": false, "KTP": true, "Surat Perjanjian DT": true, "Surat Penugasan Rector": true, "Pernyataan EWMP": true,
  "CV": true, "SIP": true, "STR": true, "Sertifikat Pelatihan": true, "Ijazah S1": true,
  "Ijazah Profesi": true, "Ijazah S2": true, "Transkrip S1": true, "Transkrip Profesi": true, "Transkrip S2": true
};

const docSarjanaKurang = {
  "Foto": false, "KTP": true, "Surat Perjanjian DT": true, "Surat Penugasan Rector": true, "Pernyataan EWMP": true,
  "CV": true, "SIP": false, "STR": true, "Sertifikat Pelatihan": false, "Ijazah S1": true,
  "Ijazah Profesi": true, "Ijazah S2": true, "Transkrip S1": true, "Transkrip Profesi": true, "Transkrip S2": false
};

const dosenSarjanaData = [
  { nama: "dr. Istiqomah, M.Biomed", bidang: "Anatomi", kualifikasi: "Magister Biomedik", dokumen: docSarjanaLengkap },
  { nama: "dr. Rahma Ayu Larasati, M.Biomed", bidang: "Biokimia", kualifikasi: "Magister Biomedik", dokumen: docSarjanaLengkap },
  { nama: "dr. Arrizqi Hafidh Abdussalam, M.Biomed.", bidang: "Histologi", kualifikasi: "Magister Biomedik", dokumen: docSarjanaLengkap },
  { nama: "dr. Syarifah Nur Aini, M.Biomed", bidang: "Biologi Sel dan Molekuler", kualifikasi: "Magister Biomedik", dokumen: docSarjanaKurang },
  { nama: "dr. Farabillah Afifah, M.Biomed", bidang: "Fisiologi", kualifikasi: "Magister Biomedik", dokumen: docSarjanaLengkap },
  { nama: "dr. Angga Ambara, Sp.MK", bidang: "Mikrobiologi", kualifikasi: "Spesialis Mikrobiologi Klinik", dokumen: docSarjanaLengkap },
  { nama: "dr. Intan Purnama, M.Biomed", bidang: "Parasitologi", kualifikasi: "Spesialis Patologi Klinis", dokumen: docSarjanaLengkap },
  { nama: "dr. Dedy Kurniawan, Sp.PA", bidang: "Patologi Anatomi", kualifikasi: "Spesialis Patologi Anatomi", dokumen: docSarjanaKurang },
  { nama: "dr. Natasya M.Ked(ClinPath), Sp.PK", bidang: "Patologi Klinik", kualifikasi: "Magister Kedokteran Klinik", dokumen: docSarjanaLengkap },
  { nama: "dr. Kessyy Widowati, M.Biomed", bidang: "Farmakologi", kualifikasi: "Magister Biomedik", dokumen: docSarjanaLengkap },
  { nama: "dr. Nilam Prariani, M.Kes", bidang: "Kesehatan Masyarakat", kualifikasi: "Magister Kesehatan", dokumen: docSarjanaLengkap },
  { nama: "dr. Delia Yusfarani, M.Kes", bidang: "Kedokteran Komunitas", kualifikasi: "Magister Kesehatan", dokumen: docSarjanaKurang },
  { nama: "dr. Muhammad Bayumi, M.H", bidang: "Bioetik dan Medikolegal", kualifikasi: "Magister Hukum Bioetika", dokumen: docSarjanaLengkap },
  { nama: "Dr. dr. Gladys Dwani Tinovella Tubarad, M.Pd.Ked", bidang: "Pendidikan Kedokteran", kualifikasi: "S3 Manajemen / S2", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 15]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 16]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 17]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 18]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 19]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 20]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 21]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 22]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 23]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 24]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 25]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap },
  { nama: "dr. [Nama Dosen 26]", bidang: "Bidang Ilmu", kualifikasi: "Kualifikasi", dokumen: docSarjanaLengkap }
];

const pembimbingKlinikData = [
  { nama: "dr. DWI Indira Setyorini, Sp.PD", bidang: "Spesialis Penyakit Dalam", kualifikasi: "Spesialis Penyakit Dalam", dokumen: { "Foto": false, "KTP": false, "Surat Penugasan": true, "CV": true, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": true } },
  { nama: "Dr. Yanuar Hidayatmo, Sp.B", bidang: "Spesialis Bedah", kualifikasi: "Spesialis Bedah", dokumen: { "Foto": false, "KTP": false, "Surat Penugasan": true, "CV": true, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": true } },
  { nama: "dr. Herti Perdana Putri, Sp. A.M.Kes", bidang: "Spesialis Anak", kualifikasi: "Spesialis Anak", dokumen: { "Foto": false, "KTP": false, "Surat Penugasan": true, "CV": false, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": false } },
  { nama: "dr. Hj. Asdaria Tenri, Sp.OG", bidang: "Kandungan", kualifikasi: "Spesialis Obstetri dan Ginekologi", dokumen: { "Foto": false, "KTP": false, "Surat Penugasan": true, "CV": true, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": true } },
  { nama: "dr. Galuh Absari Utomo, Sp.N", bidang: "Penyakit Syaraf", kualifikasi: "Spesialis Neurologi", dokumen: { "Foto": false, "KTP": false, "Surat Penugasan": true, "CV": true, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": true } },
  { nama: "dr. R. A. Mulya Liansari, Sp.KJ", bidang: "Kesehatan Jiwa", kualifikasi: "Spesialis Kedokteran Jiwa", dokumen: { "Foto": false, "KTP": false, "Surat Penugasan": true, "CV": true, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": false } },
  { nama: "dr. FifA Argentina, Sp. KK", bidang: "Kulit & Kelamin", kualifikasi: "Spesialis Kulit dan Kelamin", dokumen: { "Foto": false, "KTP": false, "Surat Penugasan": true, "CV": false, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": false, "Transkrip": false } },
  { nama: "dr. Suryadi, Sp.M", bidang: "Spesialis Mata", kualifikasi: "Spesialis Penyakit Mata", dokumen: { "Foto": false, "KTP": true, "Surat Penugasan": true, "CV": false, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": false } },
  { nama: "dr. Sari Nurfaizah, Sp.THT", bidang: "Spesialis THT", kualifikasi: "Spesialis THT-KL", dokumen: { "Foto": false, "KTP": true, "Surat Penugasan": true, "CV": true, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": true, "Ijazah (S1-S2)": true, "Transkrip": false } },
  { nama: "dr. Muhamad Salim, Sp.Rad", bidang: "Spesialis Radiologi", kualifikasi: "Spesialis Radiologi", dokumen: { "Foto": false, "KTP": true, "Surat Penugasan": true, "CV": false, "STR": false, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": false, "Transkrip": false } },
  { nama: "dr. Indra Syakti Nasution, Sp.KF", bidang: "Spesialis Forensik", kualifikasi: "Spesialis Kedokteran Forensik", dokumen: { "Foto": false, "KTP": true, "Surat Penugasan": true, "CV": false, "STR": false, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": false, "Transkrip": false } },
  { nama: "dr. Edrian Zulkarnain, Sp.JP", bidang: "Spesialis Jantung", kualifikasi: "Spesialis Jantung", dokumen: { "Foto": false, "KTP": true, "Surat Penugasan": true, "CV": false, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": false, "Transkrip": false } },
  { nama: "dr. Afprimadhona, Sp.An", bidang: "Spesialis Anastesi", kualifikasi: "Spesialis Anestesiologi", dokumen: { "Foto": false, "KTP": true, "Surat Penugasan": true, "CV": true, "STR": true, "SIP": true, "Ijazah Spesialis": false, "Serkam": false, "Ijazah (S1-S2)": true, "Transkrip": false } }
];

const tendikData = [
  { nama: "Tri Fatmawati, S.K.M", bidang: "Admin Prodi", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Mega Agistia Ipanka, SE", bidang: "Admin Profesi", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Berta Erawanti, S.Si", bidang: "Admin Kependidikan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Muhammad Imron, S.Kom", bidang: "Admin Keuangan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Iza Yusmita, S.Kom", bidang: "Admin Keuangan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Muhamad Iqbal Wahyudi, S.Pd", bidang: "Admin Keuangan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Aljier Wira Praja, S.Pd", bidang: "Admin Keuangan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Arwin Arianto, S.Pd", bidang: "Admin TI", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": false, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Rofiqo, S.Hum", bidang: "Admin Perpustakaan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Wahyu Tri Ambarini, S.TP", bidang: "Admin Kemahasiswaan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Sherly Jannati, S.Pd", bidang: "Admin Kemahasiswaan", kualifikasi: "Sarjana", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Maulidyah Nur, S.Tr.Kes", bidang: "Laboran Anatomi", kualifikasi: "D4", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Khoirunnisa, S.Tr.Kes", bidang: "Laboran Biokimia", kualifikasi: "D4", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Juliyana Jowen, A.Md.Kes", bidang: "Laboran Histologi", kualifikasi: "D3", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Sherina Ananda, S.Tr.Kes", bidang: "Laboran Biologi", kualifikasi: "D4", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Putri Alya Diani, S.Tr.Kes", bidang: "Laboran Fisiologi", kualifikasi: "D4", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Nyayu Shafa Zakiyah, A.Md", bidang: "Laboran Mikrobiologi", kualifikasi: "D3", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Maulaya Hakimmah, S.Tr.Kes", bidang: "Laboran Farmakologi", kualifikasi: "D4", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": true, "Surat Pernyataan": true } },
  { nama: "Hesty Mulyana, A.Md.Kes", bidang: "Laboran Parasitologi", kualifikasi: "D3", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Syaharanita Fitria, A.Md.Kes", bidang: "Laboran Patologi", kualifikasi: "D3", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } },
  { nama: "Putri Permatasari, AMAK", bidang: "Laboran Patologi Klinik", kualifikasi: "Diploma", dokumen: { "Foto": false, "KTP": true, "Ijazah": true, "Transkrip": true, "Sertifikat": false, "Surat Pernyataan": true } }
];

exports.seedData = async () => {
  try {
    const conn = await pool.getConnection();

    // Check if data already exists
    const [dosenSarjanaCount] = await conn.query('SELECT COUNT(*) as count FROM dosen_sarjana');
    if (dosenSarjanaCount[0].count === 0) {
      console.log('Seeding dosen sarjana data...');
      for (const data of dosenSarjanaData) {
        await conn.query(
          'INSERT INTO dosen_sarjana (nama, bidang, kualifikasi, dokumen) VALUES (?, ?, ?, ?)',
          [data.nama, data.bidang, data.kualifikasi, JSON.stringify(data.dokumen)]
        );
      }
      console.log(`Seeded ${dosenSarjanaData.length} dosen sarjana records`);
    }

    const [pembimbingCount] = await conn.query('SELECT COUNT(*) as count FROM pembimbing_klinik');
    if (pembimbingCount[0].count === 0) {
      console.log('Seeding pembimbing klinik data...');
      for (const data of pembimbingKlinikData) {
        await conn.query(
          'INSERT INTO pembimbing_klinik (nama, bidang, kualifikasi, dokumen) VALUES (?, ?, ?, ?)',
          [data.nama, data.bidang, data.kualifikasi, JSON.stringify(data.dokumen)]
        );
      }
      console.log(`Seeded ${pembimbingKlinikData.length} pembimbing klinik records`);
    }

    const [tendikCount] = await conn.query('SELECT COUNT(*) as count FROM tendik');
    if (tendikCount[0].count === 0) {
      console.log('Seeding tendik data...');
      for (const data of tendikData) {
        await conn.query(
          'INSERT INTO tendik (nama, bidang, kualifikasi, dokumen) VALUES (?, ?, ?, ?)',
          [data.nama, data.bidang, data.kualifikasi, JSON.stringify(data.dokumen)]
        );
      }
      console.log(`Seeded ${tendikData.length} tendik records`);
    }

    conn.release();
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
};
