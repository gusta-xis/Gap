const express = require('express');
const cors = require('cors');
const path = require('path'); // <--- 1. IMPORTANTE: Importe o módulo path
require('dotenv').config();

// Rotas
const apiRoutes = require('./src/api');

// Middlewares
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const logger = require('./src/middlewares/logger');

const app = express();

app.use(cors());

// 1. JSON vem primeiro
app.use(express.json());

// 2. Logger vem segundo
app.use(logger);

// Atende a rota raiz com a página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Redireciona requests diretas para /login.html para manter a rota limpa '/'
app.get('/login.html', (req, res) => {
    res.redirect(301, '/');
});

// Serve a página de subtemas numa rota limpa '/subtemas' (evita mostrar 'subtemas.html')
app.get('/subtemas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subtemas.html'));
});

// --- AQUI ESTÁ A MÁGICA ---
// 3. Arquivos Estáticos (HTML, CSS, JS)
// Isso diz: "Se a requisição não for JSON, procure na pasta 'public'"
app.use(express.static(path.join(__dirname, 'public'))); 

// 4. Rotas da API (onde o Auth e Validate são chamados)
// Se não achou arquivo estático, ele tenta ver se é uma rota de API
app.use('/api', apiRoutes);

// 5. Error Middleware por último
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
);