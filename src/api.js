// ========================================================
// API ROUTER - VERSÃO 1 (/api/v1)
// ========================================================

const express = require('express');
const router = express.Router();

const userRoutes = require('./Modules/Gap-Core/routes/userRoutes');
const salarioRoutes = require('./Modules/Gap-Finance/routes/salarioRoutes');
const fixoRoutes = require('./Modules/Gap-Finance/routes/fixoRoutes');
const variaveisRoutes = require('./Modules/Gap-Finance/routes/variaveisRoutes');

// ========== ROTAS DOS MÓDULOS ==========
router.use('/users', userRoutes);
router.use('/salarios', salarioRoutes);
router.use('/gastos-fixos', fixoRoutes);
router.use('/gastos-variaveis', variaveisRoutes);

module.exports = router;
