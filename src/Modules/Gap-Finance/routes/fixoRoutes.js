// ========================================================
// FIXO ROUTES - COM VALIDAÇÃO DE ID
// ========================================================

const express = require('express');
const router = express.Router();

const fixoController = require('../controllers/fixoController.js');
const authMiddleware = require('../../../middlewares/authMiddleware.js');
const { validateGastoFixo } = require('../middlewares/validatorsMiddleware.js');

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
// POST /api/v1/gastos-fixos - Criar novo gasto fixo
router.post('/', authMiddleware, validateGastoFixo, fixoController.create);

// GET /api/v1/gastos-fixos - Listar gastos fixos do usuário
router.get('/', authMiddleware, fixoController.findByUserId);

// GET /api/v1/gastos-fixos/todos - Listar todos (admin)
router.get('/todos', authMiddleware, fixoController.findAll);

// GET /api/v1/gastos-fixos/:id - Buscar por ID
router.get('/:id', authMiddleware, validateNumericId, fixoController.findById);

// PUT /api/v1/gastos-fixos/:id - Atualizar
router.put('/:id', authMiddleware, validateNumericId, validateGastoFixo, fixoController.update);

// PATCH /api/v1/gastos-fixos/:id - Atualização parcial
router.patch('/:id', authMiddleware, validateNumericId, fixoController.update);

// DELETE /api/v1/gastos-fixos/:id - Deletar
router.delete('/:id', authMiddleware, validateNumericId, fixoController.delete);

module.exports = router;
