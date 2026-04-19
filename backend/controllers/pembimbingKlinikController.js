const pool = require('../config/database');
const { deleteAllFiles } = require('../utils/fileUtils');

// Get all pembimbing klinik
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pembimbing_klinik ORDER BY id ASC');
    const formattedRows = rows.map(row => ({
      ...row,
      dokumen: typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching pembimbing klinik:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Get single pembimbing klinik
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM pembimbing_klinik WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const row = rows[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;
    res.json(row);
  } catch (error) {
    console.error('Error fetching pembimbing klinik:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Create new pembimbing klinik
exports.create = async (req, res) => {
  try {
    const { nama, bidang, kualifikasi, dokumen } = req.body;

    if (!nama) {
      return res.status(400).json({ error: 'Nama is required' });
    }

    const defaultDokumen = {
      "Foto": false,
      "KTP": false,
      "Surat Penugasan": false,
      "CV": false,
      "STR": false,
      "SIP": false,
      "Ijazah Spesialis": false,
      "Serkam": false,
      "Ijazah (S1-S2)": false,
      "Transkrip": false
    };

    const finalDokumen = dokumen || defaultDokumen;

    const [result] = await pool.query(
      'INSERT INTO pembimbing_klinik (nama, bidang, kualifikasi, dokumen) VALUES (?, ?, ?, ?)',
      [nama, bidang || '', kualifikasi || '', JSON.stringify(finalDokumen)]
    );

    const [newRow] = await pool.query('SELECT * FROM pembimbing_klinik WHERE id = ?', [result.insertId]);
    const row = newRow[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;

    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating pembimbing klinik:', error);
    res.status(500).json({ error: 'Failed to create data' });
  }
};

// Update pembimbing klinik
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, bidang, kualifikasi, dokumen } = req.body;

    const [existing] = await pool.query('SELECT * FROM pembimbing_klinik WHERE id = ?', [id]);
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
    await pool.query(`UPDATE pembimbing_klinik SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM pembimbing_klinik WHERE id = ?', [id]);
    const row = updated[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;

    res.json(row);
  } catch (error) {
    console.error('Error updating pembimbing klinik:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
};

// Delete pembimbing klinik
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete uploaded files first
    deleteAllFiles('pembimbingKlinik', id);

    const [result] = await pool.query('DELETE FROM pembimbing_klinik WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting pembimbing klinik:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
};
