const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const db = require('./src/config/db'); // Database connection
const apiRoutes = require('./src/api'); // Centralized API routes
const userRoutes = require('../Gap/src/Modules/Gap-Core/routes/userRoutes');
const sanitizationMiddleware = require('./src/middlewares/sanitizationMiddleware');
const { authPageMiddleware } = require('./src/middlewares/authPageMiddleware');

// ... Environment Validation ...
// [Keep everything else]

// Page Navigation Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login.html', (req, res) => res.redirect(301, '/'));

app.get('/subsistemas', (req, res) => res.sendFile(path.join(__dirname, 'public', 'subtemas.html')));
app.get('/financeiro', (req, res) => res.sendFile(path.join(__dirname, 'public', 'finance.html')));
app.get('/financeiro/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

// No-cache for protected views
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};
app.use(['/subsistemas', '/financeiro', '/financeiro/dashboard'], noCache);

// --- Error Handling ---
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  const message = process.env.NODE_ENV === 'production' ? 'Erro Interno do Servidor' : err.message;
  res.status(err.status || 500).json({ error: message });
});

// --- Server Startup & DB Check ---
// Legacy database column check (Keeping per requirement to preserve architecture)
db.query("ALTER TABLE gastos_variaveis ADD COLUMN meta_id INT DEFAULT NULL", (err) => {
  if (!err || err.code === 'ER_DUP_FIELDNAME') {
    db.query(`
            ALTER TABLE gastos_variaveis 
            ADD CONSTRAINT fk_gastos_metas 
            FOREIGN KEY (meta_id) REFERENCES metas(id) 
            ON DELETE SET NULL
        `, () => { }); // Silently fail if exists
  }
});

/**
 * Migration: Resets code columns in Users table.
 * Ensures 'reset_code' and 'reset_code_expires' columns exist.
 */
const migrationResetCode = () => {
  db.query("ALTER TABLE users ADD COLUMN reset_code VARCHAR(6) DEFAULT NULL", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Migration Error (reset_code):', err.message);
  });
  db.query("ALTER TABLE users ADD COLUMN reset_code_expires DATETIME DEFAULT NULL", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Migration Error (reset_code_expires):', err.message);
  });
};
migrationResetCode();

/**
 * Migration: Audit Logs Table.
 * Creates the 'audit_logs' table if it doesn't exist.
 */
const migrationAuditLogs = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      action VARCHAR(50) NOT NULL,
      ip_address VARCHAR(45),
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `;
  db.query(createTableQuery, (err) => {
    if (err) console.error('Migration Error (audit_logs):', err.message);
    else console.log('✅ Table audit_logs checked/created.');
  });
};
migrationAuditLogs();

/**
 * Migration: Modules Access (JSON).
 * Ensures 'modules_access' column exists for tracking first access per module.
 */
const migrationModulesAccess = () => {
  db.query("ALTER TABLE users ADD COLUMN modules_access JSON DEFAULT NULL", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Migration Error (modules_access):', err.message);
  });
};
migrationModulesAccess();

/**
 * Migration: Admin & Credentials.
 * Ensures 'role' and 'credential' columns exist and seeds the Super Admin.
 */
const migrationAdmin = () => {
  // 1. Roles
  db.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Migration Error (role):', err.message);
  });

  // 2. Credentials
  db.query("ALTER TABLE users ADD COLUMN credential VARCHAR(20) UNIQUE DEFAULT NULL", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Migration Error (credential):', err.message);
  });

  // 3. Allow Null Password (First Access)
  db.query("ALTER TABLE users MODIFY senha VARCHAR(255) NULL", (err) => {
    if (err) console.error('Migration Error (senha nullable):', err.message);

    // 4. Seed Super Admin (only runs after column modifications)
    seedSuperAdmin();
  });
};

/**
 * Seeds the Super Admin user if not present.
 */
const seedSuperAdmin = () => {
  const superUser = {
    credential: 'GAP0001',
    password: null, // First access requires setting password
    role: 'super_admin',
    nome: 'Admin Geral'
  };

  db.query('SELECT * FROM users WHERE credential = ?', [superUser.credential], (err, rows) => {
    if (err) return console.error('Seed Check Error:', err.message);

    if (rows.length === 0) {
      console.log('🌱 Seeding Super Admin (First Access)...');

      db.query(
        'INSERT INTO users (nome, email, senha, role, credential) VALUES (?, ?, ?, ?, ?)',
        [superUser.nome, 'gap@sistema', null, superUser.role, superUser.credential],
        (err) => {
          if (err) console.error('❌ Error creating Super Admin:', err.message);
          else console.log(`✅ Super Admin created: ${superUser.credential} (Waiting for Activation)`);
        }
      );
    } else {
      console.log('✅ Super Admin already exists.');
    }
  });
};
migrationAdmin();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🔒 Security: Active (${process.env.NODE_ENV || 'development'})`);
});
