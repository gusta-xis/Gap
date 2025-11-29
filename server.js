const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/api');
// const errorMiddleware = require('./src/middlewares/errorMiddleware'); // Descomente se tiver criado o arquivo

const app = express();

app.use(cors());
app.use(express.json());

// Todas as rotas começam com /api
app.use('/api', apiRoutes);

// app.use(errorMiddleware); // Descomente se tiver criado o arquivo

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
);