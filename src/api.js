const express = require('express');
const router = express.Router();

const userRoutes = require('../src/Modules/Gap-Core/routes/userRoutes');
const salarioRoutes = require('../src/Modules/Gap-Finance/routes/salarioRoutes');
const fixoRoutes = require('../src/Modules/Gap-Finance/routes/fixoRoutes');

router.use('/users', userRoutes);
router.use('/salarios', salarioRoutes);
router.use('/gastos-fixos', fixoRoutes);

module.exports = router;