require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const dosenSarjanaRoutes = require('./routes/dosenSarjanaRoutes');
const pembimbingKlinikRoutes = require('./routes/pembimbingKlinikRoutes');
const tendikRoutes = require('./routes/tendikRoutes');
const statsRoutes = require('./routes/statsRoutes');
const dokumenRoutes = require('./routes/dokumenRoutes');
const { createDefaultAdmin } = require('./controllers/authController');
const { seedData } = require('./controllers/seedController');

app.use('/api/auth', authRoutes);
app.use('/api/dosen-sarjana', dosenSarjanaRoutes);
app.use('/api/pembimbing-klinik', pembimbingKlinikRoutes);
app.use('/api/tendik', tendikRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/dokumen', dokumenRoutes);

// Serve uploaded files (protected via auth middleware on routes)
app.use('/uploads', express.static(uploadsDir));

// Public route for getting document keys order
app.get('/api/public/documents/:sdmType', (req, res) => {
  const { sdmType } = req.params;
  const { dokumenConfig } = require('./utils/dokumenConfig');

  const config = dokumenConfig[sdmType];
  if (!config) {
    return res.status(400).json({ error: 'Jenis SDM tidak valid' });
  }

  // Return document keys with labels for display
  const documents = config.documents.map(doc => ({
    key: doc.key,
    label: doc.label
  }));
  res.json({ documents });
});

// Public route for getting photo URL (without auth)
app.get('/api/public/photo/:sdmType/:personnelId', async (req, res) => {
  const { sdmType, personnelId } = req.params;
  const { dokumenConfig, toOriginalKey } = require('./utils/dokumenConfig');
  const { listFiles } = require('./utils/fileUtils');

  try {
    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    const [rows] = await pool.query(
      `SELECT dokumen FROM ${config.tableName} WHERE id = ?`,
      [personnelId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Personil tidak ditemukan' });
    }

    let dokumen = rows[0].dokumen;
    if (typeof dokumen === 'string') {
      dokumen = JSON.parse(dokumen);
    }

    const hasFoto = dokumen['Foto'] === true;

    let photoUrl = null;
    if (hasFoto) {
      const files = listFiles(sdmType, personnelId);
      const fotoFile = files.find(f => f.filename.startsWith('Foto_'));
      if (fotoFile) {
        photoUrl = `/uploads/${fotoFile.path}`;
      }
    }

    res.json({ hasFoto, photoUrl });
  } catch (error) {
    console.error('Error getting photo:', error);
    res.status(500).json({ error: 'Gagal mengambil foto' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Initialize database tables
async function initDatabase() {
  try {
    const connection = await pool.getConnection();

    // Create admins table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nama_lengkap VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create dosen_sarjana table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dosen_sarjana (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama VARCHAR(100) NOT NULL,
        bidang VARCHAR(100),
        kualifikasi VARCHAR(100),
        dokumen JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create pembimbing_klinik table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pembimbing_klinik (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama VARCHAR(100) NOT NULL,
        bidang VARCHAR(100),
        kualifikasi VARCHAR(100),
        dokumen JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create tendik table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tendik (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama VARCHAR(100) NOT NULL,
        bidang VARCHAR(100),
        kualifikasi VARCHAR(100),
        dokumen JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
  await createDefaultAdmin();
  await seedData();
});
