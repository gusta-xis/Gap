const express = require('express');
const router = express.Router();

// Verifique se o nome do arquivo na pasta controllers é 'fixoController.js' ou 'gastoFixoController.js'
const fixoController = require('../controllers/fixoController.js');

const authMiddleware = require('../middlewares/authMiddleware.js');

// Verifique se o nome do arquivo é 'validatorsMiddleware.js' ou 'validators.js'
const { validateGastoFixo } = require('../middlewares/validatorsMiddleware.js');

// Rotas Base: /api/gastos-fixos

// CRIAR
router.post('/', authMiddleware, validateGastoFixo, fixoController.create);


router.get('/', authMiddleware, fixoController.findByUserId);

// LISTAR TUDO (ADMIN)
// Se quiser ver tudo de todos, usamos uma rota separada
router.get('/todos', authMiddleware, fixoController.findAll);

// BUSCAR POR ID
router.get('/:id', authMiddleware, fixoController.findById);

// ATUALIZAR
router.put('/:id', authMiddleware, validateGastoFixo, fixoController.update);
router.patch('/:id', authMiddleware, fixoController.update);

// DELETAR
router.delete('/:id', authMiddleware, fixoController.delete);

module.exports = router;