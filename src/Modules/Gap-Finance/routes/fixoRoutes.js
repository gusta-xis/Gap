const express = require('express');
const router = express.Router();

// Verifique se o nome do arquivo na pasta controllers é 'fixoController.js' ou 'gastoFixoController.js'
const fixoController = require('../controllers/fixoController.js');

const authMiddleware = require('../../../middlewares/authMiddleware.js');

// Verifique se o nome do arquivo é 'validatorsMiddleware.js' ou 'validators.js'
const { validateGastoFixo } = require('../middlewares/validatorsMiddleware.js');

router.post('/', authMiddleware, validateGastoFixo, fixoController.create);
router.get('/', authMiddleware, fixoController.findByUserId);
router.get('/todos', authMiddleware, fixoController.findAll);
router.get('/:id', authMiddleware, fixoController.findById);
router.put('/:id', authMiddleware, validateGastoFixo, fixoController.update);
router.patch('/:id', authMiddleware, fixoController.update);
router.delete('/:id', authMiddleware, fixoController.delete);

module.exports = router;
