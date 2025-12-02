const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rotas
const apiRoutes = require('./src/api');

// Middlewares
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const logger = require('./src/middlewares/logger'); // <--- Importa o Logger

const app = express();

app.use(cors());

// 1. JSON vem primeiro (pra gente conseguir ler o body no logger)
app.use(express.json());

// 2. Logger vem segundo (inicia o relógio)
app.use(logger);

// 3. Rotas vem terceiro (onde o Auth e Validate são chamados)
app.use('/api', apiRoutes);

// 4. Error Middleware por último
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
);