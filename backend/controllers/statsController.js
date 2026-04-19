const pool = require('../config/database');

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

exports.getStats = async (req, res) => {
  try {
    const [dosenSarjana] = await pool.query('SELECT * FROM dosen_sarjana');
    const [pembimbingKlinik] = await pool.query('SELECT * FROM pembimbing_klinik');
    const [tendik] = await pool.query('SELECT * FROM tendik');

    const formatData = (rows) => rows.map(row => ({
      ...row,
      dokumen: typeof row.dokumen === 'string' ? JSON.parse(row.dokumen) : row.dokumen
    }));

    const formattedDosenSarjana = formatData(dosenSarjana);
    const formattedPembimbing = formatData(pembimbingKlinik);
    const formattedTendik = formatData(tendik);

    const sarjanaStats = formattedDosenSarjana.map(p => ({
      ...p,
      ...calculateProgress(p.dokumen)
    }));

    const klinikStats = formattedPembimbing.map(p => ({
      ...p,
      ...calculateProgress(p.dokumen)
    }));

    const tendikStats = formattedTendik.map(p => ({
      ...p,
      ...calculateProgress(p.dokumen)
    }));

    res.json({
      dosenSarjana: {
        total: formattedDosenSarjana.length,
        complete: sarjanaStats.filter(p => p.isComplete).length,
        incomplete: sarjanaStats.filter(p => !p.isComplete).length,
        avgPercentage: sarjanaStats.length > 0
          ? Math.round(sarjanaStats.reduce((acc, p) => acc + p.percentage, 0) / sarjanaStats.length)
          : 0
      },
      pembimbingKlinik: {
        total: formattedPembimbing.length,
        complete: klinikStats.filter(p => p.isComplete).length,
        incomplete: klinikStats.filter(p => !p.isComplete).length,
        avgPercentage: klinikStats.length > 0
          ? Math.round(klinikStats.reduce((acc, p) => acc + p.percentage, 0) / klinikStats.length)
          : 0
      },
      tendik: {
        total: formattedTendik.length,
        complete: tendikStats.filter(p => p.isComplete).length,
        incomplete: tendikStats.filter(p => !p.isComplete).length,
        avgPercentage: tendikStats.length > 0
          ? Math.round(tendikStats.reduce((acc, p) => acc + p.percentage, 0) / tendikStats.length)
          : 0
      },
      grandTotal: {
        total: formattedDosenSarjana.length + formattedPembimbing.length + formattedTendik.length,
        complete: sarjanaStats.filter(p => p.isComplete).length + klinikStats.filter(p => p.isComplete).length + tendikStats.filter(p => p.isComplete).length
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
