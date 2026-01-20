const express = require('express');
const router = express.Router();

const metasController = require('../controllers/metasController.js');
const authMiddleware = require('../../../middlewares/authMiddleware.js');
// const { validateMeta } = require('../middlewares/validatorsMiddleware.js'); // Crie se necessário

const validateNumericId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'ID deve ser um número inteiro válido'
    });
  }
  next();
};

router.post('/', authMiddleware, metasController.create); // validateMeta se existir
router.get('/', authMiddleware, metasController.findByUserId);
router.get('/todos', authMiddleware, metasController.findAll);
router.get('/:id', authMiddleware, validateNumericId, metasController.findById);
router.put('/:id', authMiddleware, validateNumericId, metasController.update);
router.patch('/:id', authMiddleware, validateNumericId, metasController.update);
router.delete('/:id', authMiddleware, validateNumericId, metasController.delete);

module.exports = router;