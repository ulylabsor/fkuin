const pool = require('../config/database');
const { deleteAllFiles } = require('../utils/fileUtils');

// Get all dosen sarjana
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dosen_sarjana ORDER BY id ASC');
    const formattedRows = rows.map(row => ({
      ...row,
      dokumen: typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching dosen sarjana:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Get single dosen sarjana
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM dosen_sarjana WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const row = rows[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;
    res.json(row);
  } catch (error) {
    console.error('Error fetching dosen sarjana:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Create new dosen sarjana
exports.create = async (req, res) => {
  try {
    const { nama, nik, no_str, no_hp, alamat_ktp, tempat_lahir, tanggal_lahir, mata_kuliah, judul_thesis, bidang, kualifikasi, dokumen, catatan } = req.body;

    if (!nama) {
      return res.status(400).json({ error: 'Nama is required' });
    }

    const defaultDokumen = {
      "Foto": false,
      "KTP": false,
      "Surat Perjanjian DT": false,
      "Surat Penugasan Rector": false,
      "Pernyataan EWMP": false,
      "CV": false,
      "SIP": false,
      "STR": false,
      "Sertifikat Pelatihan": false,
      "Ijazah S1": false,
      "Ijazah Profesi": false,
      "Ijazah S2": false,
      "Transkrip S1": false,
      "Transkrip Profesi": false,
      "Transkrip S2": false
    };

    const finalDokumen = dokumen || defaultDokumen;

    const [result] = await pool.query(
      'INSERT INTO dosen_sarjana (nama, nik, no_str, no_hp, alamat_ktp, tempat_lahir, tanggal_lahir, mata_kuliah, judul_thesis, bidang, kualifikasi, dokumen, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nama, nik || '', no_str || '', no_hp || '', alamat_ktp || '', tempat_lahir || '', tanggal_lahir || null, mata_kuliah || '', judul_thesis || '', bidang || '', kualifikasi || '', JSON.stringify(finalDokumen), catatan || '']
    );

    const [newRow] = await pool.query('SELECT * FROM dosen_sarjana WHERE id = ?', [result.insertId]);
    const row = newRow[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;

    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating dosen sarjana:', error);
    res.status(500).json({ error: 'Failed to create data' });
  }
};

// Update dosen sarjana
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nik, no_str, no_hp, alamat_ktp, tempat_lahir, tanggal_lahir, mata_kuliah, judul_thesis, bidang, kualifikasi, dokumen, catatan } = req.body;

    const [existing] = await pool.query('SELECT * FROM dosen_sarjana WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const updates = [];
    const values = [];

    if (nama !== undefined) { updates.push('nama = ?'); values.push(nama); }
    if (nik !== undefined) { updates.push('nik = ?'); values.push(nik); }
    if (no_str !== undefined) { updates.push('no_str = ?'); values.push(no_str); }
    if (no_hp !== undefined) { updates.push('no_hp = ?'); values.push(no_hp); }
    if (alamat_ktp !== undefined) { updates.push('alamat_ktp = ?'); values.push(alamat_ktp); }
    if (tempat_lahir !== undefined) { updates.push('tempat_lahir = ?'); values.push(tempat_lahir); }
    if (tanggal_lahir !== undefined) { updates.push('tanggal_lahir = ?'); values.push(tanggal_lahir || null); }
    if (mata_kuliah !== undefined) { updates.push('mata_kuliah = ?'); values.push(mata_kuliah); }
    if (judul_thesis !== undefined) { updates.push('judul_thesis = ?'); values.push(judul_thesis); }
    if (bidang !== undefined) { updates.push('bidang = ?'); values.push(bidang); }
    if (kualifikasi !== undefined) { updates.push('kualifikasi = ?'); values.push(kualifikasi); }
    if (dokumen !== undefined) { updates.push('dokumen = ?'); values.push(JSON.stringify(dokumen)); }
    if (catatan !== undefined) { updates.push('catatan = ?'); values.push(catatan); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE dosen_sarjana SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM dosen_sarjana WHERE id = ?', [id]);
    const row = updated[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;

    res.json(row);
  } catch (error) {
    console.error('Error updating dosen sarjana:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
};

// Delete dosen sarjana
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete uploaded files first
    deleteAllFiles('dosenTetap', id);

    const [result] = await pool.query('DELETE FROM dosen_sarjana WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting dosen sarjana:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
};
