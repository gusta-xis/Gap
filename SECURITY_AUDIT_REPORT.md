# 🔒 RELATÓRIO DE AUDITORIA DE SEGURANÇA - GAP Finance Dashboard

**Data:** 11 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** Vulnerabilidades Críticas Identificadas

---

## 📋 SUMÁRIO EXECUTIVO

Foram identificadas **12 vulnerabilidades críticas** e **8 problemas de segurança moderados** que precisam ser corrigidos para garantir a proteção dos dados dos usuários.

### Severidade:
- 🔴 **Críticas (5):** Risco imediato de exploração
- 🟠 **Altas (7):** Risco significativo de comprometimento
- 🟡 **Moderadas (8):** Melhorias recomendadas

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. **EXPOSIÇÃO DE JWT_SECRET NO CONSOLE (authMiddleware.js)**

**Severidade:** 🔴 CRÍTICA  
**Tipo:** Information Disclosure  
**Arquivo:** `src/middlewares/authMiddleware.js` (Linha 16)

**Problema:**
```javascript
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET); // ❌ NUNCA faça isso!
```

**Risco:**
- JWT_SECRET é exposto em logs do servidor
- Qualquer pessoa com acesso aos logs pode falsificar tokens
- Comprometimento total do sistema de autenticação

**Correção:**
```javascript
// ❌ REMOVER ESTA LINHA:
// console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET);

// ✅ SE PRECISAR DEBUGAR, USE APENAS INDICADOR:
console.log('🔍 Token recebido e verificado');
```

---

### 2. **HEADERS DE SEGURANÇA AUSENTES (server.js)**

**Severidade:** 🔴 CRÍTICA  
**Tipo:** Missing Security Headers  
**Arquivo:** `server.js`

**Problema:**
- Falta `Content-Security-Policy`
- Falta `X-Content-Type-Options`
- Falta `X-Frame-Options`
- Falta `Strict-Transport-Security`
- CORS aberto para qualquer origem (`cors()`)

**Risco:**
- Vulnerabilidade a XSS, Clickjacking e MIME-sniffing
- Qualquer aplicação pode acessar sua API
- Man-in-the-middle attacks

**Correção:**
```javascript
// 1. Instalar helmet
// npm install helmet

// 2. No server.js, adicione após os requires:
const helmet = require('helmet');

// 3. Adicione antes das rotas:
app.use(helmet());

// 4. Configure CORS específico:
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Apenas origins autorizadas
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 5. Adicione headers customizados:
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

### 3. **SQL INJECTION EM userModel.js (UPDATE com ?)**

**Severidade:** 🔴 CRÍTICA  
**Tipo:** SQL Injection  
**Arquivo:** `src/Modules/Gap-Core/models/userModel.js` (Linha 34)

**Problema:**
```javascript
update(id, data, callback) {
    db.query('UPDATE users SET ? WHERE id = ?', [data, id], callback); // ⚠️ Risco se houver campos dinâmicos não validados
}
```

**Risco:**
- Se um campo não validado for enviado, pode executar SQL malicioso
- Ataque de Mass Assignment (modificar campos como `role`, `admin`, etc.)

**Correção:**
```javascript
update(id, data, callback) {
    // Whitelist de campos permitidos para atualização
    const allowedFields = ['nome', 'email', 'senha'];
    const filteredData = {};
    
    for (const key of allowedFields) {
        if (key in data) {
            filteredData[key] = data[key];
        }
    }
    
    if (Object.keys(filteredData).length === 0) {
        return callback(new Error('Nenhum campo válido para atualizar'));
    }
    
    db.query('UPDATE users SET ? WHERE id = ?', [filteredData, id], callback);
}
```

---

### 4. **ARMAZENAMENTO INSEGURO DE TOKEN NO LOCALSTORAGE (script.js, finance.js)**

**Severidade:** 🔴 CRÍTICA  
**Tipo:** XSS Vulnerability  
**Arquivo:** `public/scripts/script.js`, `finance.js`

**Problema:**
```javascript
localStorage.setItem('token', result.token); // ❌ Vulnerável a XSS
localStorage.setItem('user', JSON.stringify(result.user)); // ❌ Dados sensíveis expostos
```

**Risco:**
- Qualquer script malicioso pode acessar e roubar o token
- Se o site sofrer XSS, o token é comprometido
- Token persiste mesmo após logout do navegador

**Correção (Melhoria Imediata):**
```javascript
// ✅ Use sessionStorage em vez de localStorage (expira com a aba)
sessionStorage.setItem('token', result.token);

// ✅ Se usar localStorage, minimize dados sensíveis:
localStorage.setItem('userName', result.user.nome); // Apenas nome, nada mais
// NÃO armazene ID completo, email ou detalhes financeiros

// ✅ Para melhor proteção, use HttpOnly Cookies (requer mudança no backend):
// Os cookies HttpOnly não podem ser acessados por JavaScript, protegendo contra XSS
```

**Correção Completa (Backend):**
```javascript
// Em server.js, configure cookies seguros:
const cookieOptions = {
  httpOnly: true,      // Impede acesso via JavaScript
  secure: true,        // Apenas HTTPS
  sameSite: 'Strict',  // CSRF protection
  maxAge: 3600000      // 1 hora
};

app.use((req, res, next) => {
  // Override para enviar token como cookie
  if (res.json) {
    const originalJson = res.json;
    res.json = function(data) {
      if (data.token) {
        res.cookie('authToken', data.token, cookieOptions);
        delete data.token; // Remove token da resposta JSON
      }
      return originalJson.call(this, data);
    };
  }
  next();
});
```

---

### 5. **FALTA DE RATE LIMITING (Brute Force)**

**Severidade:** 🔴 CRÍTICA  
**Tipo:** Brute Force Attack  
**Arquivo:** `server.js`, `src/Modules/Gap-Core/routes/userRoutes.js`

**Problema:**
- Não há limite de tentativas de login
- Um atacante pode tentar milhões de senhas

**Risco:**
- Força bruta em senhas de usuários
- Ataques DDoS na rota de login

**Correção:**
```javascript
// 1. Instalar express-rate-limit
// npm install express-rate-limit

// 2. Em server.js:
const rateLimit = require('express-rate-limit');

// 3. Criar limitadores:
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // Máximo 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,                   // 100 requisições por IP
});

// 4. Aplicar aos middlewares:
app.use('/api/', apiLimiter);
app.use('/api/users/login', loginLimiter);
```

---

## 🟠 VULNERABILIDADES ALTAS

### 6. **VALIDAÇÃO INADEQUADA DE EMAIL (userMiddleware.js)**

**Severidade:** 🟠 ALTA  
**Tipo:** Input Validation  
**Arquivo:** `src/Modules/Gap-Core/middlewares/userMiddleware.js`

**Problema:**
```javascript
// Não valida formato de email ou senha fraca
if (!nome || !email || !senha) {
    // Apenas verifica se existe, não o formato
}
```

**Correção:**
```javascript
const validateUser = (req, res, next) => {
    const { nome, email, senha } = req.body;

    // Se for rota de login, ignora validação de nome
    if (req.path === '/login') {
        // Valida apenas email e senha
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido.' });
        }
        if (!senha || senha.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres.' });
        }
        return next();
    }

    // Para cadastro
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Campos nome, email e senha são obrigatórios.' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido.' });
    }

    // Validar força da senha
    if (senha.length < 8) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres.' });
    }

    if (!/[A-Z]/.test(senha)) {
        return res.status(400).json({ error: 'Senha deve conter pelo menos uma letra maiúscula.' });
    }

    if (!/[0-9]/.test(senha)) {
        return res.status(400).json({ error: 'Senha deve conter pelo menos um número.' });
    }

    if (!/[!@#$%^&*]/.test(senha)) {
        return res.status(400).json({ error: 'Senha deve conter pelo menos um caractere especial (!@#$%^&*).' });
    }

    next();
};

module.exports = { validateUser };
```

---

### 7. **FALTA DE VALIDAÇÃO DE AUTORIZAÇÃO (Acesso Horizontal)**

**Severidade:** 🟠 ALTA  
**Tipo:** Insecure Direct Object Reference (IDOR)  
**Arquivo:** Todos os controladores

**Problema:**
```javascript
// Em fixoController.js
findById(req, res) {
    fixoService.findById(req.params.id, (err, row) => {
        // Não valida se o usuário tem permissão de acessar este registro!
        return res.status(200).json(row);
    });
}
```

**Risco:**
- Usuário A pode acessar dados do Usuário B alterando o ID na URL
- Um atacante pode conhecer todos os gastos de outros usuários

**Correção:**
```javascript
// Em fixoModel.js - adicione uma query que filtra por user_id:
findByIdAndUser(id, userId, callback) {
    db.query(
        'SELECT * FROM gastos_fixos WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, rows) => {
            if (err) return callback(err);
            callback(null, rows[0] || null);
        }
    );
}

// Em fixoController.js:
findById(req, res) {
    const id = req.params.id;
    const userId = req.user.id; // Pega do token autenticado

    fixoService.findByIdAndUser(id, userId, (err, row) => {
        if (err) return sendError(res, err);
        if (!row) {
            return res.status(403).json({ message: 'Acesso negado' });
        }
        return res.status(200).json(row);
    });
}
```

---

### 8. **FALTA DE SANITIZAÇÃO DE SAÍDA (XSS)**

**Severidade:** 🟠 ALTA  
**Tipo:** Cross-Site Scripting (XSS)  
**Arquivo:** `public/scripts/finance.js`, `api-service.js`

**Problema:**
```javascript
// Se houver dados no banco com scripts maliciosos:
const userData = JSON.parse(localStorage.getItem('user'));
// Se userData.nome = "<script>alert('hack')</script>"
// Isso não é verificado antes de usar
```

**Correção:**
```javascript
// Criar função de sanitização:
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str; // textContent escapa HTML automaticamente
    return div.innerHTML;
}

// Ou use uma biblioteca como DOMPurify:
// npm install dompurify

// Usar ao exibir dados do banco:
const cleanName = DOMPurify.sanitize(userData.nome);
document.getElementById('userName').textContent = cleanName; // Use textContent, não innerHTML
```

---

### 9. **TOKENS SEM EXPIRAÇÃO ADEQUADA OU REFRESH TOKENS**

**Severidade:** 🟠 ALTA  
**Tipo:** Session Management  
**Arquivo:** `src/Modules/Gap-Core/services/userService.js`

**Problema:**
```javascript
const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // ✅ Tempo de expiração está correto
    // Mas não há refresh token
);
```

**Risco:**
- Após 1 hora, usuário é deslogado abruptamente
- Não há mecanismo de renovação de sessão

**Correção:**
```javascript
login: (email, senha, callback) => {
    userModel.findByEmail(email, (err, user) => {
        if (err) return callback({ status: 500, message: 'Erro banco' });
        if (!user) return callback({ status: 401, message: 'Credenciais inválidas' });

        bcrypt.compare(senha, user.senha, (compareErr, same) => {
            if (compareErr) return callback({ status: 500, message: 'Erro ao verificar senha' });
            if (!same) return callback({ status: 401, message: 'Credenciais inválidas' });

            // ✅ Token de acesso (curta duração)
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '15m' } // Reduzido para 15 minutos
            );

            // ✅ Refresh token (longa duração)
            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            callback(null, {
                token,
                refreshToken,
                user: { id: user.id, nome: user.nome, email: user.email },
            });
        });
    });
}
```

---

### 10. **DATABASE CONNECTION NÃO TRATA ERROS ADEQUADAMENTE**

**Severidade:** 🟠 ALTA  
**Tipo:** Error Handling / Information Disclosure  
**Arquivo:** `src/config/db.js`

**Problema:**
```javascript
db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no banco:', err); // Expõe detalhes do erro
    return; // Não impede que a aplicação continue!
  }
  console.log('✅ Banco de dados conectado!');
});
```

**Risco:**
- Erro do banco é exposto em logs (detalhes de credenciais)
- Servidor continua rodando mesmo sem banco de dados
- Requisições falham silenciosamente

**Correção:**
```javascript
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

let isConnected = false;

db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no banco. Verifique as credenciais.');
    // NÃO exponha detalhes do erro
    // Se em desenvolvimento, você pode logar apenas a mensagem:
    if (process.env.NODE_ENV === 'development') {
      console.error(err.message);
    }
    
    // Tente reconectar a cada 5 segundos
    setTimeout(() => {
      console.log('Tentando reconectar ao banco...');
      db.connect(arguments.callee); // Recursão
    }, 5000);
    return;
  }
  
  isConnected = true;
  console.log('✅ Banco de dados conectado!');
});

// Exporta função para verificar conexão
db.checkConnection = () => isConnected;

module.exports = db;
```

---

### 11. **FALTA DE PROTEÇÃO CSRF (Cross-Site Request Forgery)**

**Severidade:** 🟠 ALTA  
**Tipo:** CSRF Attack  
**Arquivo:** `server.js`

**Problema:**
- GET e POST não possuem proteção CSRF
- Um site malicioso pode fazer requisições em nome do usuário autenticado

**Correção:**
```javascript
// 1. Instalar csurf
// npm install csurf

// 2. Em server.js:
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// Middleware CSRF (protege POST, PUT, DELETE)
const csrfProtection = csrf({ cookie: true });

// 3. Para rotas HTML (GET):
app.get('/financeiro', csrfProtection, (req, res) => {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    res.sendFile(path.join(__dirname, 'public', 'finance.html'));
});

// 4. Para rotas API, validar header CSRF:
app.use('/api/', csrfProtection);
```

---

### 12. **LOGS CONTÊM DADOS SENSÍVEIS**

**Severidade:** 🟠 ALTA  
**Tipo:** Information Disclosure  
**Arquivo:** `src/middlewares/logger.js`

**Problema:**
```javascript
// 4. Mostra o Body se tiver (ajuda a debuggar)
if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   📦  Payload:`, JSON.stringify(req.body)); // ❌ Expõe senhas e dados sensíveis!
}
```

**Risco:**
- Senhas de usuários são exibidas em logs
- Dados financeiros sensíveis são registrados

**Correção:**
```javascript
// Criar função para mascarar dados sensíveis:
function maskSensitiveData(body) {
    const masked = { ...body };
    const sensitiveFields = ['senha', 'password', 'pin', 'credit_card', 'ssn'];
    
    for (const field of sensitiveFields) {
        if (field in masked) {
            masked[field] = '***MASKED***';
        }
    }
    return masked;
}

// No middleware:
if (req.body && Object.keys(req.body).length > 0) {
    const maskedBody = maskSensitiveData(req.body);
    console.log(`   📦  Payload:`, JSON.stringify(maskedBody));
}
```

---

## 🟡 VULNERABILIDADES MODERADAS

### 13. **FALTA DE VALIDAÇÃO DE TIPO EM IDS DE PARÂMETROS**

**Severidade:** 🟡 MODERADA  
**Tipo:** Input Validation  
**Arquivo:** Todos os controladores

**Problema:**
```javascript
// /gastos-fixos/abc ou /gastos-fixos/'); DROP TABLE...
fixoService.findById(req.params.id, (err, row) => {
    // Não valida se ID é número
});
```

**Correção:**
```javascript
// Criar middleware validador:
const validateNumericId = (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    req.params.id = id;
    next();
};

// Usar nas rotas:
router.get('/:id', authMiddleware, validateNumericId, fixoController.findById);
```

---

### 14. **CONFIGURAÇÃO DO CORS INSEGURA (server.js)**

**Severidade:** 🟡 MODERADA  
**Tipo:** CORS Misconfiguration  
**Arquivo:** `server.js`

**Problema:**
```javascript
app.use(cors()); // ❌ Aceita requisições de qualquer origem
```

**Correção:** (Ver item 2 acima)

---

### 15. **FALTA DE .env VALIDATION**

**Severidade:** 🟡 MODERADA  
**Tipo:** Configuration Management  
**Arquivo:** `server.js`

**Problema:**
```javascript
require('dotenv').config();
// Não valida se variáveis obrigatórias existem
```

**Correção:**
```javascript
require('dotenv').config();

// Validar variáveis obrigatórias
const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Variável de ambiente obrigatória ausente: ${envVar}`);
        process.exit(1);
    }
}

console.log('✅ Todas as variáveis de ambiente foram validadas');
```

---

### 16. **FALTA DE HELMET PARA PROTEÇÃO DE HEADERS**

**Severidade:** 🟡 MODERADA  
**Tipo:** Missing Security Headers  
**Arquivo:** `server.js`

**Solução:** Ver item 2 acima

---

### 17. **FALTA DE LOGGING ESTRUTURADO**

**Severidade:** 🟡 MODERADA  
**Tipo:** Monitoring & Logging  
**Arquivo:** Projeto inteiro

**Problema:**
- Logs apenas em console
- Nenhuma auditoria de ações de usuários
- Impossível rastrear ataques

**Correção:**
```javascript
// npm install winston

const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'gap-api' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

// Use no lugar de console.log:
logger.info('Login realizado', { userId: user.id });
logger.error('Tentativa de acesso não autorizado', { userId, path: req.path });

module.exports = logger;
```

---

### 18. **FALTA DE HTTPS/TLS ENFORCEMENT**

**Severidade:** 🟡 MODERADA  
**Tipo:** Data Encryption in Transit  
**Arquivo:** `server.js`

**Problema:**
- Aplicação roda em HTTP (inseguro)
- Dados podem ser interceptados

**Correção:**
```javascript
// Para desenvolvimento local, HTTP está ok
// Para PRODUÇÃO, adicione:
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

---

### 19. **FALTA DE VERSIONAMENTO DE API**

**Severidade:** 🟡 MODERADA  
**Tipo:** API Design  
**Arquivo:** `src/api.js`

**Solução:**
```javascript
// Versionar rotas:
const v1Router = express.Router();
v1Router.use('/users', userRoutes);
v1Router.use('/salarios', salarioRoutes);

app.use('/api/v1', v1Router);
```

---

### 20. **FALTA DE PROTEÇÃO CONTRA REQUEST SMUGGLING**

**Severidade:** 🟡 MODERADA  
**Tipo:** HTTP Request Smuggling  

**Correção:**
```javascript
// Em server.js:
app.use((req, res, next) => {
    // Remover headers perigosos
    delete req.headers['transfer-encoding'];
    next();
});

// Ou configure o Express para rejeitar requisições ambíguas
app.set('trust proxy', 1);
```

---

## ✅ PRÓXIMOS PASSOS - PLANO DE AÇÃO

### **Fase 1 (IMEDIATA - 24 horas)**
- [ ] Remover `console.log('🔑 JWT_SECRET:')` do authMiddleware.js
- [ ] Instalar e configurar Helmet
- [ ] Implementar rate limiting em rota de login
- [ ] Validar email com regex
- [ ] Adicionar validação de autorização (IDOR)

### **Fase 2 (URGENTE - 1 semana)**
- [ ] Migrar token de localStorage para sessionStorage
- [ ] Implementar refresh tokens
- [ ] Sanitizar logs (mascarar senhas)
- [ ] Implementar CSRF protection
- [ ] Validar IDs como números
- [ ] Melhorar tratamento de erros do banco

### **Fase 3 (IMPORTANTE - 2 semanas)**
- [ ] Implementar logging estruturado com Winston
- [ ] Adicionar validação de .env
- [ ] Implementar sanitização XSS
- [ ] Configurar HTTPS/TLS
- [ ] Versionar API
- [ ] Implementar proteção contra request smuggling

### **Fase 4 (MELHORIAS - 1 mês)**
- [ ] Adicionar 2FA (Two-Factor Authentication)
- [ ] Implementar auditoria de mudanças
- [ ] Adicionar rate limiting por usuário (não apenas IP)
- [ ] Implementar backup automático do banco
- [ ] Testes de segurança automatizados

---

## 🔧 EXEMPLO COMPLETO DE IMPLEMENTAÇÃO - server.js SEGURO

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Validar variáveis de ambiente
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Variável de ambiente ausente: ${envVar}`);
        process.exit(1);
    }
}

const app = express();

// ========== SEGURANÇA ==========
app.use(helmet());

// CORS seguro
const corsOptions = {
    origin: ['http://localhost:3000', process.env.ALLOWED_ORIGINS?.split(',') || []].flat(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Headers de segurança adicionais
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

app.use('/api/', apiLimiter);
app.use('/api/users/login', loginLimiter);

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '10kb' })); // Limita tamanho do payload
app.use(express.static(path.join(__dirname, 'public')));

// ========== ROTAS ==========
const apiRoutes = require('./src/api');
app.use('/api', apiRoutes);

// Rotas de navegação
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => res.redirect(301, '/'));
app.get('/subsistemas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subtemas.html'));
});

app.get('/financeiro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance.html'));
});

app.get('/financeiro/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-dashboard.html'));
});

// ========== INICIALIZAÇÃO ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log('📂 Ambiente:', process.env.NODE_ENV || 'development');
});
```

---

## 📚 REFERENCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CWE - Common Weakness Enumeration](https://cwe.mitre.org/)

---

**Gerado em:** 11 de Dezembro de 2025  
**Revisor:** GitHub Copilot Security Audit  
**Versão:** 1.0
