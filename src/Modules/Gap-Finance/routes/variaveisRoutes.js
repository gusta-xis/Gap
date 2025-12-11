// ========================================================
// VARIAVEIS ROUTES - COM VALIDAÇÃO DE ID
// ========================================================

const express = require('express');
const router = express.Router();

const variaveisController = require('../controllers/variaveisController.js');
const authMiddleware = require('../../../middlewares/authMiddleware.js');
const { validateGastoVariavel } = require('../middlewares/validatorsMiddleware.js');

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
// POST /api/v1/gastos-variaveis - Criar novo gasto variável
router.post('/', authMiddleware, validateGastoVariavel, variaveisController.create);

// GET /api/v1/gastos-variaveis - Listar gastos variáveis do usuário
router.get('/', authMiddleware, variaveisController.findByUserId);

// GET /api/v1/gastos-variaveis/todos - Listar todos (admin)
router.get('/todos', authMiddleware, variaveisController.findAll);

// GET /api/v1/gastos-variaveis/:id - Buscar por ID
router.get('/:id', authMiddleware, validateNumericId, variaveisController.findById);

// PUT /api/v1/gastos-variaveis/:id - Atualizar
router.put('/:id', authMiddleware, validateNumericId, validateGastoVariavel, variaveisController.update);

// PATCH /api/v1/gastos-variaveis/:id - Atualização parcial
router.patch('/:id', authMiddleware, validateNumericId, variaveisController.update);

// DELETE /api/v1/gastos-variaveis/:id - Deletar
router.delete('/:id', authMiddleware, validateNumericId, variaveisController.delete);

module.exports = router;
