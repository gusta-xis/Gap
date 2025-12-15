const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// =======================================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// =======================================================
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'DB_PORT',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Variável de ambiente obrigatória ausente: ${envVar}`);
    process.exit(1);
  }
}

// DB_PASSWORD pode ser vazia (banco local sem senha)
if (process.env.DB_PASSWORD === undefined) {
  console.error(`❌ Variável de ambiente DB_PASSWORD não definida (pode estar vazia, mas precisa existir)`);
  process.exit(1);
}

const app = express();

// =======================================================
// 0. SECURITY HEADERS COM HELMET
// =======================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrcAttr: ["'unsafe-inline'"], // Permite onclick inline
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Headers de segurança adicionais
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// =======================================================
// 1. CORS SEGURO (APENAS ORIGINS AUTORIZADAS)
// =======================================================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      process.env.ALLOWED_ORIGINS || ''
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
  maxAge: 3600,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// =======================================================
// 2. RATE LIMITING
// =======================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // máximo 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit atingido para IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Muitas tentativas. Tente novamente mais tarde.' 
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,                   // 100 requisições por 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/users/login', loginLimiter);

// =======================================================
// 3. MIDDLEWARE DE SEGURANÇA
// =======================================================
// Limita tamanho do payload
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: false }));

// Remove headers perigosos
app.use((req, res, next) => {
  delete req.headers['transfer-encoding'];
  next();
});

// =======================================================
// 4. ARQUIVOS ESTÁTICOS (FRONT-END)
// =======================================================
// Serve a pasta 'public' (CSS, JS, Imagens)
app.set('etag', false);
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
}));

// =======================================================
// 5. ROTAS DA API (BACK-END)
// =======================================================
// Carrega as rotas centralizadas
const apiRoutes = require('./src/api');
app.use('/api/v1', apiRoutes);
console.log('✅ APIs carregadas com sucesso (v1).');


const userRoutes = require('../Gap/src/Modules/Gap-Core/routes/userRoutes');
app.use('/api/v1/users', userRoutes);
console.log('✅ Usuários carregados com sucesso (v1).');

// =======================================================
// 5.1. MIDDLEWARE DE AUTENTICAÇÃO DE PÁGINAS
// =======================================================
const { authPageMiddleware, authResetPasswordMiddleware } = require('./src/middlewares/authPageMiddleware');

// =======================================================
// 6. ROTAS DE NAVEGAÇÃO (URLS LIMPAS)
// =======================================================

// Rota Raiz -> Carrega o Login (login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota Explícita de Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Redirecionamento de segurança (acesso direto ao arquivo)
app.get('/login.html', (req, res) => res.redirect(301, '/'));

// Rota Dashboard (A autenticação é feita no client-side via JavaScript)
app.get('/subsistemas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subtemas.html'));
});

// Rota Financeiro (A autenticação é feita no client-side via JavaScript)
app.get('/financeiro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance.html'));
});

// Rota Financeiro Dashboard (SPA - A autenticação é feita no client-side via JavaScript)
app.get('/financeiro/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Rota Reset Password (Protegida - Requer token válido na query string)
app.get('/reset-password', authResetPasswordMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// =======================================================
// 7. TRATAMENTO DE ERROS GLOBAL
// =======================================================
// Middleware para reforçar no-cache especificamente em rotas protegidas
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

app.use(['/subsistemas', '/financeiro', '/financeiro/dashboard'], noCache);

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.message);
  
  // Não expõe detalhes do erro em produção
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor'
    : err.message;
  
  res.status(err.status || 500).json({ error: message });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// =======================================================
// INICIALIZAÇÃO
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📂 Rotas Disponíveis:`);
    console.log(`   - Login:      /`);
    console.log(`   - Dashboard:  /subsistemas`);
    console.log(`   - Financeiro: /financeiro`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Segurança: Ativa`);
    console.log(`--------------------------------------------------`);
});