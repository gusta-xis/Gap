const express = require('express');
const router = express.Router();

const fixoController = require('../controllers/fixoController.js');
const authMiddleware = require('../../../middlewares/authMiddleware.js');
const { validateGastoFixo } = require('../middlewares/validatorsMiddleware.js');

const validateNumericId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'ID deve ser um número inteiro válido'
    });
  }

  next();
};

router.post('/', authMiddleware, validateGastoFixo, fixoController.create);

router.get('/', authMiddleware, fixoController.findByUserId);

router.get('/todos', authMiddleware, fixoController.findAll);

router.get('/:id', authMiddleware, validateNumericId, fixoController.findById);

router.put('/:id', authMiddleware, validateNumericId, validateGastoFixo, fixoController.update);

router.patch('/:id', authMiddleware, validateNumericId, fixoController.update);

router.delete('/:id', authMiddleware, validateNumericId, fixoController.delete);

module.exports = router;
