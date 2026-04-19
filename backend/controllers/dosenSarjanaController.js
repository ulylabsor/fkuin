const pool = require('../config/database');

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
    const { nama, bidang, kualifikasi, dokumen } = req.body;

    if (!nama) {
      return res.status(400).json({ error: 'Nama is required' });
    }

    const defaultDokumen = {
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
      'INSERT INTO dosen_sarjana (nama, bidang, kualifikasi, dokumen) VALUES (?, ?, ?, ?)',
      [nama, bidang || '', kualifikasi || '', JSON.stringify(finalDokumen)]
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
    const { nama, bidang, kualifikasi, dokumen } = req.body;

    const [existing] = await pool.query('SELECT * FROM dosen_sarjana WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const updates = [];
    const values = [];

    if (nama !== undefined) { updates.push('nama = ?'); values.push(nama); }
    if (bidang !== undefined) { updates.push('bidang = ?'); values.push(bidang); }
    if (kualifikasi !== undefined) { updates.push('kualifikasi = ?'); values.push(kualifikasi); }
    if (dokumen !== undefined) { updates.push('dokumen = ?'); values.push(JSON.stringify(dokumen)); }

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
