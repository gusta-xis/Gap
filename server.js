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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🔒 Segurança: Ativa (${process.env.NODE_ENV || 'development'})`);
});
