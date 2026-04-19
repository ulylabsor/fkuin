const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const SALT_ROUNDS = 10;

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nama_lengkap: admin.nama_lengkap
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, nama_lengkap, created_at FROM admins WHERE id = ?', [req.admin.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

// Create initial admin if not exists
exports.createDefaultAdmin = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', ['admin']);

    if (rows.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
      await pool.query('INSERT INTO admins (username, password_hash, nama_lengkap) VALUES (?, ?, ?)', [
        'admin',
        passwordHash,
        'Administrator'
      ]);
      console.log('Default admin created: admin / admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};
