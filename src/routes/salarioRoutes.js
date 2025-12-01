const express = require('express');
const router = express.Router();
const salarioController = require('../controllers/salarioController');
const { validateSalario } = require('../middlewares/validatorsMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas Base: /api/users (definido no api.js)
router.post('/', authMiddleware, validateSalario, salarioController.create);           // Cria um usuario
router.get('/', authMiddleware, salarioController.findAll);           // Busca todos
router.get('/search', authMiddleware, salarioController.findByUserId); // Busca por user_id (?user_id=x)
router.get('/:id', authMiddleware, salarioController.findById);       // Busca por ID
router.put('/:id', authMiddleware, validateSalario, salarioController.update);         // Atualiza completo
router.patch('/:id', authMiddleware, salarioController.update);       // Atualiza parcial (mesma logica no seu SQL)
router.delete('/:id', authMiddleware, salarioController.delete);      // Deleta


module.exports = router;