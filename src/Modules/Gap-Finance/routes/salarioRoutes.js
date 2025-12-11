// ========================================================
// SALARIO ROUTES - COM VALIDAÇÃO DE ID
// ========================================================

const express = require('express');
const router = express.Router();

const salarioController = require('../controllers/salarioController');
const { validateSalario } = require('../middlewares/validatorsMiddleware');
const authMiddleware = require('../../../middlewares/authMiddleware.js');

/**
 * Middleware para validar ID numérico
 */
const validateNumericId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'ID deve ser um número inteiro válido'
    });
  }

  next();
};

// ========== ROTAS ==========
// POST /api/v1/salarios - Criar novo salário
router.post('/', authMiddleware, validateSalario, salarioController.create);

// GET /api/v1/salarios - Listar salários do usuário
router.get('/', authMiddleware, salarioController.findByUserId);

// GET /api/v1/salarios/todos - Listar todos (admin)
router.get('/todos', authMiddleware, salarioController.findAll);

// GET /api/v1/salarios/:id - Buscar por ID
router.get('/:id', authMiddleware, validateNumericId, salarioController.findById);

// PUT /api/v1/salarios/:id - Atualizar
router.put('/:id', authMiddleware, validateNumericId, validateSalario, salarioController.update);

// PATCH /api/v1/salarios/:id - Atualização parcial
router.patch('/:id', authMiddleware, validateNumericId, salarioController.update);

// DELETE /api/v1/salarios/:id - Deletar
router.delete('/:id', authMiddleware, validateNumericId, salarioController.delete);

module.exports = router;
