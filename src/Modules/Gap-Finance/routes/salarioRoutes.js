const express = require('express');
const router = express.Router();

const salarioController = require('../controllers/salarioController');
const { validateSalario } = require('../middlewares/validatorsMiddleware');
const authMiddleware = require('../../../middlewares/authMiddleware.js');

const validateNumericId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'ID deve ser um número inteiro válido'
    });
  }

  next();
};

router.post('/', authMiddleware, validateSalario, salarioController.create);

router.get('/', authMiddleware, salarioController.findByUserId);

router.get('/todos', authMiddleware, salarioController.findAll);

router.get('/:id', authMiddleware, validateNumericId, salarioController.findById);

router.put('/:id', authMiddleware, validateNumericId, validateSalario, salarioController.update);

router.patch('/:id', authMiddleware, validateNumericId, salarioController.update);

router.delete('/:id', authMiddleware, validateNumericId, salarioController.delete);

module.exports = router;
