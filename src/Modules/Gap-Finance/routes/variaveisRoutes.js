const express = require('express');
const router = express.Router();

const variaveisController = require('../controllers/variaveisController.js');
const authMiddleware = require('../../../middlewares/authMiddleware.js');
const { validateGastoVariavel } = require('../middlewares/validatorsMiddleware.js');

const validateNumericId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'ID deve ser um número inteiro válido'
    });
  }

  next();
};

router.post('/', authMiddleware, validateGastoVariavel, variaveisController.create);

router.get('/', authMiddleware, variaveisController.findByUserId);

router.get('/todos', authMiddleware, variaveisController.findAll);

router.get('/:id', authMiddleware, validateNumericId, variaveisController.findById);

router.put('/:id', authMiddleware, validateNumericId, validateGastoVariavel, variaveisController.update);

router.patch('/:id', authMiddleware, validateNumericId, variaveisController.update);

router.delete('/:id', authMiddleware, validateNumericId, variaveisController.delete);

module.exports = router;
