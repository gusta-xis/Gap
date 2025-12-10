const express = require('express');
const router = express.Router();

// Verifique se o nome do arquivo na pasta controllers é 'fixoController.js' ou 'gastoFixoController.js'
const variaveisController = require('../controllers/variaveisController.js');

const authMiddleware = require('../../../middlewares/authMiddleware.js');

// Verifique se o nome do arquivo é 'validatorsMiddleware.js' ou 'validators.js'
const {
  validateGastoVariavel,
} = require('../middlewares/validatorsMiddleware.js');

router.post(
  '/',
  authMiddleware,
  validateGastoVariavel,
  variaveisController.create
);
router.get('/', authMiddleware, variaveisController.findByUserId);
router.get('/todos', authMiddleware, variaveisController.findAll);
router.get('/:id', authMiddleware, variaveisController.findById);
router.put(
  '/:id',
  authMiddleware,
  validateGastoVariavel,
  variaveisController.update
);
router.patch('/:id', authMiddleware, variaveisController.update);
router.delete('/:id', authMiddleware, variaveisController.delete);

module.exports = router;
