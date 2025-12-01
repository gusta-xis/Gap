const express = require('express');
const router = express.Router();

const userRoutes = require('./routes/userRoutes');
const salarioRoutes = require('./routes/salarioRoutes');

router.use('/users', userRoutes);
router.use('/salarios', salarioRoutes);

module.exports = router;