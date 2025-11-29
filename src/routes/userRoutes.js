const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rotas Base: /api/users (definido no api.js)

router.post('/', userController.create);           // Cria um usuario
router.get('/', userController.findAll);           // Busca todos
router.get('/search', userController.findByEmail); // Busca por email (?email=x)
router.get('/:id', userController.findById);       // Busca por ID
router.put('/:id', userController.update);         // Atualiza completo
router.patch('/:id', userController.update);       // Atualiza parcial (mesma logica no seu SQL)
router.delete('/:id', userController.delete);      // Deleta

module.exports = router;