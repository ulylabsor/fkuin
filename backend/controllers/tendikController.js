const pool = require('../config/database');
const { deleteAllFiles } = require('../utils/fileUtils');

// Get all tendik
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tendik ORDER BY id ASC');
    const formattedRows = rows.map(row => ({
      ...row,
      dokumen: typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching tendik:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Get single tendik
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM tendik WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const row = rows[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;
    res.json(row);
  } catch (error) {
    console.error('Error fetching tendik:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Create new tendik
exports.create = async (req, res) => {
  try {
    const { nama, bidang, kualifikasi, dokumen, catatan } = req.body;

    if (!nama) {
      return res.status(400).json({ error: 'Nama is required' });
    }

    const defaultDokumen = {
      "Foto": false,
      "KTP": false,
      "Ijazah": false,
      "Transkrip": false,
      "Sertifikat": false,
      "Surat Pernyataan": false
    };

    const finalDokumen = dokumen || defaultDokumen;

    const [result] = await pool.query(
      'INSERT INTO tendik (nama, bidang, kualifikasi, dokumen, catatan) VALUES (?, ?, ?, ?, ?)',
      [nama, bidang || '', kualifikasi || '', JSON.stringify(finalDokumen), catatan || '']
    );

    const [newRow] = await pool.query('SELECT * FROM tendik WHERE id = ?', [result.insertId]);
    const row = newRow[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;

    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating tendik:', error);
    res.status(500).json({ error: 'Failed to create data' });
  }
};

// Update tendik
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, bidang, kualifikasi, dokumen, catatan } = req.body;

    const [existing] = await pool.query('SELECT * FROM tendik WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const updates = [];
    const values = [];

    if (nama !== undefined) { updates.push('nama = ?'); values.push(nama); }
    if (bidang !== undefined) { updates.push('bidang = ?'); values.push(bidang); }
    if (kualifikasi !== undefined) { updates.push('kualifikasi = ?'); values.push(kualifikasi); }
    if (dokumen !== undefined) { updates.push('dokumen = ?'); values.push(JSON.stringify(dokumen)); }
    if (catatan !== undefined) { updates.push('catatan = ?'); values.push(catatan); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE tendik SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM tendik WHERE id = ?', [id]);
    const row = updated[0];
    row.dokumen = typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen;

    res.json(row);
  } catch (error) {
    console.error('Error updating tendik:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
};

// Delete tendik
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete uploaded files first
    deleteAllFiles('tendik', id);

    const [result] = await pool.query('DELETE FROM tendik WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting tendik:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
};
