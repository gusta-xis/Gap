const express = require('express');
const router = express.Router();

// Importa as rotas de usuário
const userRoutes = require('./routes/userRoutes');

// Define o prefixo '/users'. 
// Isso faz com que as rotas fiquem: /api/users, /api/users/:id, etc.
router.use('/users', userRoutes);

module.exports = router;