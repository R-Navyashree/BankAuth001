const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to Aiven MySQL database');
  createTables();
});

// Auto-create tables on startup
function createTables() {
  const kodUserTable = `
    CREATE TABLE IF NOT EXISTS KodUser (
      uid INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      balance DECIMAL(15,2) DEFAULT 100000.00,
      phone VARCHAR(20),
      role VARCHAR(50) DEFAULT 'Customer'
    )
  `;

  const userTokenTable = `
    CREATE TABLE IF NOT EXISTS UserToken (
      tid INT AUTO_INCREMENT PRIMARY KEY,
      token TEXT NOT NULL,
      uid INT NOT NULL,
      expiry DATETIME NOT NULL,
      FOREIGN KEY (uid) REFERENCES KodUser(uid)
    )
  `;

  db.query(kodUserTable, (err) => {
    if (err) console.error('Error creating KodUser table:', err.message);
    else console.log('KodUser table ready');
  });

  db.query(userTokenTable, (err) => {
    if (err) console.error('Error creating UserToken table:', err.message);
    else console.log('UserToken table ready');
  });
}

// ========================
// POST /api/register
// ========================
app.post('/api/register', async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO KodUser (username, email, password, phone, role, balance) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [username, email, hashedPassword, phone || null, 'Customer', 100000.00], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'User already exists' });
        }
        return res.status(500).json({ message: 'Server error' });
      }
      return res.status(201).json({ message: 'Registration successful' });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ========================
// POST /api/login
// ========================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = 'SELECT * FROM KodUser WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { sub: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Calculate expiry for DB
    const expiry = new Date(Date.now() + 3600000);

    // Save token to UserToken table
    const tokenSql = 'INSERT INTO UserToken (token, uid, expiry) VALUES (?, ?, ?)';
    db.query(tokenSql, [token, user.uid, expiry], (err) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 3600000,
        sameSite: 'lax'
      });

      return res.status(200).json({ message: 'Login successful', username: user.username });
    });
  });
});

// ========================
// GET /api/getBalance
// ========================
app.get('/api/getBalance', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.sub;

    const sql = 'SELECT balance FROM KodUser WHERE username = ?';
    db.query(sql, [username], (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ balance: results[0].balance });
    });
  } catch (error) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }
});

// ========================
// POST /api/logout
// ========================
app.post('/api/logout', (req, res) => {
  const token = req.cookies.token;

  res.clearCookie('token');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const username = decoded.sub;

      // Get uid and delete tokens
      const sql = 'SELECT uid FROM KodUser WHERE username = ?';
      db.query(sql, [username], (err, results) => {
        if (!err && results.length > 0) {
          db.query('DELETE FROM UserToken WHERE uid = ?', [results[0].uid]);
        }
      });
    } catch (e) {
      // Token may be expired, just clear cookie
    }
  }

  return res.status(200).json({ message: 'Logged out successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`KodBank server running on http://localhost:${PORT}`);
});
