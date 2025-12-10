const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// =======================================================
// CONFIGURAÇÕES GERAIS
// =======================================================
app.use(cors());
app.use(express.json());

// =======================================================
// 1. ARQUIVOS ESTÁTICOS (FRONT-END)
// =======================================================
// Serve a pasta 'public' (CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, 'public')));

// =======================================================
// 2. ROTAS DA API (BACK-END)
// =======================================================
// Verifica se o arquivo de rotas existe para não quebrar o servidor
const routesPath = path.join(__dirname, 'src', 'Modules', 'Gap-Core', 'routes', 'userRoutes.js');

if (fs.existsSync(routesPath)) {
    const userRoutes = require(routesPath);
    app.use('/api/users', userRoutes);
    console.log('✅ API de usuários carregada com sucesso.');
} else {
    console.error('❌ ERRO: Arquivo de rotas não encontrado em:', routesPath);
}

// =======================================================
// 3. ROTAS DE NAVEGAÇÃO (URLS LIMPAS)
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

// Rota Dashboard (Sem .html)
app.get('/subsistemas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subtemas.html'));
});

// Rota Financeiro (Sem .html)
app.get('/financeiro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance.html'));
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
    console.log(`--------------------------------------------------`);
});