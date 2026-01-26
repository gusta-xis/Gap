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
const { authPageMiddleware, authResetPasswordMiddleware } = require('./src/middlewares/authPageMiddleware');

// --- Environment Validation ---
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PORT', 'JWT_SECRET'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Variável de ambiente obrigatória ausente: ${envVar}`);
    process.exit(1);
  }
});

const app = express();

// --- Security Middleware (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"], // Consider moving inline scripts to files
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Additional Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// --- CORS Configuration ---
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.ALLOWED_ORIGINS
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS não permitido'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// --- Rate Limiting ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/users/login', loginLimiter);

// --- Body Parsing & Sanitization ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: false }));
app.use(sanitizationMiddleware);

// --- Static Files ---
app.set('etag', false);
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));

// --- Routes ---
app.use('/api/v1', apiRoutes);
app.use('/api/v1/users', userRoutes);

// Page Navigation Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login.html', (req, res) => res.redirect(301, '/'));

app.get('/subsistemas', (req, res) => res.sendFile(path.join(__dirname, 'public', 'subtemas.html')));
app.get('/financeiro', (req, res) => res.sendFile(path.join(__dirname, 'public', 'finance.html')));
app.get('/financeiro/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

app.get('/reset-password', authResetPasswordMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

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
  console.error('🔥 Erro:', err.message);
  const message = process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message;
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

// --- Migration: Reset Code Columns in Users ---
const migrationResetCode = () => {
  db.query("ALTER TABLE users ADD COLUMN reset_code VARCHAR(6) DEFAULT NULL", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Migration Error (reset_code):', err.message);
  });
  db.query("ALTER TABLE users ADD COLUMN reset_code_expires DATETIME DEFAULT NULL", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Migration Error (reset_code_expires):', err.message);
  });
};
migrationResetCode();

// --- Migration: Audit Logs Table ---
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
    else console.log('✅ Tabela audit_logs verificada/criada.');
  });
};
migrationAuditLogs();

// --- Migration: Admin & Credentials ---
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
          if (err) console.error('❌ Erro ao criar Super Admin:', err.message);
          else console.log(`✅ Super Admin criado: ${superUser.credential} (Aguardando Ativação)`);
        }
      );
    } else {
      console.log('✅ Super Admin já existe.');
    }
  });
};
migrationAdmin();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🔒 Segurança: Ativa (${process.env.NODE_ENV || 'development'})`);
});
