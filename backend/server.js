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
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const dosenTetapRoutes = require('./routes/dosenTetapRoutes');
const pembimbingKlinikRoutes = require('./routes/pembimbingKlinikRoutes');
const tendikRoutes = require('./routes/tendikRoutes');
const statsRoutes = require('./routes/statsRoutes');
const dokumenRoutes = require('./routes/dokumenRoutes');
const { createDefaultAdmin } = require('./controllers/authController');
const { seedData } = require('./controllers/seedController');

app.use('/api/auth', authRoutes);
app.use('/api/dosen-tetap', dosenTetapRoutes);
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
        photoUrl = `${process.env.BACKEND_URL || ''}/uploads/${fotoFile.path}`;
      }
    }

    res.json({ hasFoto, photoUrl });
  } catch (error) {
    console.error('Error getting photo:', error);
    res.status(500).json({ error: 'Gagal mengambil foto' });
  }
});

// Public route for serving document files (without auth)
app.get('/api/public/file/:sdmType/:personnelId/:filename', (req, res) => {
  const { sdmType, personnelId, filename } = req.params;
  const { dokumenConfig } = require('./utils/dokumenConfig');

  // Translate sdmType to folder name
  const config = dokumenConfig[sdmType];
  if (!config) {
    return res.status(400).json({ error: 'Jenis SDM tidak valid' });
  }

  // Security: prevent directory traversal
  const uploadsDir = path.join(__dirname, 'uploads');
  const filePath = path.join(uploadsDir, config.folder, personnelId, filename);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File tidak ditemukan' });
  }

  // Set content type based on extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };

  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

// Public route to check if document file exists for all personnel
app.get('/api/public/file-info/:sdmType', async (req, res) => {
  const { sdmType } = req.params;
  const { dokumenConfig } = require('./utils/dokumenConfig');
  const { listFiles, findFileByDocKey } = require('./utils/fileUtils');

  try {
    const config = dokumenConfig[sdmType];
    if (!config) {
      return res.status(400).json({ error: 'Jenis SDM tidak valid' });
    }

    // Get all personnel for this SDM type
    const [rows] = await pool.query(`SELECT id, nama, dokumen FROM ${config.tableName}`);

    const personnel = rows.map(person => {
      const files = listFiles(sdmType, person.id);
      const documents = config.documents.map(doc => {
        const file = findFileByDocKey(sdmType, person.id, doc.key);
        return {
          key: doc.key,
          label: doc.label,
          hasFile: !!file,
          filename: file ? file.filename : null,
          fileUrl: file ? `${process.env.BACKEND_URL || ''}/api/public/file/${sdmType}/${person.id}/${file.filename}` : null
        };
      });
      return {
        id: person.id,
        nama: person.nama,
        documents
      };
    });

    res.json({ personnel, sdmType });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Gagal mengambil info file' });
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
        nik VARCHAR(20),
        no_str VARCHAR(30),
        no_hp VARCHAR(20),
        alamat_ktp TEXT,
        tempat_lahir VARCHAR(100),
        tanggal_lahir DATE,
        mata_kuliah VARCHAR(255),
        judul_thesis VARCHAR(255),
        bidang VARCHAR(100),
        kualifikasi VARCHAR(100),
        dokumen JSON,
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist (migration for existing databases)
    await connection.query(`
      ALTER TABLE dosen_sarjana
      ADD COLUMN IF NOT EXISTS nik VARCHAR(20),
      ADD COLUMN IF NOT EXISTS no_str VARCHAR(30),
      ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20),
      ADD COLUMN IF NOT EXISTS alamat_ktp TEXT,
      ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
      ADD COLUMN IF NOT EXISTS mata_kuliah VARCHAR(255),
      ADD COLUMN IF NOT EXISTS judul_thesis VARCHAR(255)
    `);

    // Create pembimbing_klinik table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pembimbing_klinik (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama VARCHAR(100) NOT NULL,
        no_str VARCHAR(30),
        no_hp VARCHAR(20),
        alamat_ktp TEXT,
        sip VARCHAR(30),
        bidang VARCHAR(100),
        kualifikasi VARCHAR(100),
        dokumen JSON,
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to existing tables
    await connection.query(`
      ALTER TABLE pembimbing_klinik
      ADD COLUMN IF NOT EXISTS no_str VARCHAR(30),
      ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20),
      ADD COLUMN IF NOT EXISTS alamat_ktp TEXT,
      ADD COLUMN IF NOT EXISTS sip VARCHAR(30)
    `);

    await connection.query(`
      ALTER TABLE tendik
      ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20),
      ADD COLUMN IF NOT EXISTS alamat_ktp TEXT
    `);

    // Create tendik table

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
