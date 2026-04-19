require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const dosenSarjanaRoutes = require('./routes/dosenSarjanaRoutes');
const pembimbingKlinikRoutes = require('./routes/pembimbingKlinikRoutes');
const tendikRoutes = require('./routes/tendikRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { createDefaultAdmin } = require('./controllers/authController');
const { seedData } = require('./controllers/seedController');

app.use('/api/auth', authRoutes);
app.use('/api/dosen-sarjana', dosenSarjanaRoutes);
app.use('/api/pembimbing-klinik', pembimbingKlinikRoutes);
app.use('/api/tendik', tendikRoutes);
app.use('/api/stats', statsRoutes);

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
