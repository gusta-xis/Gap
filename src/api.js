const express = require('express');
const router = express.Router();

const userRoutes = require('./routes/userRoutes');
const salarioRoutes = require('./routes/salarioRoutes');
const fixoRoutes = require('./routes/fixoRoutes');

router.use('/users', userRoutes);
router.use('/salarios', salarioRoutes);
router.use('/gastos-fixos', fixoRoutes);

module.exports = router;