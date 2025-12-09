const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser } = require('../middlewares/userMiddleware');
const authMiddleware = require('../../../middlewares/authMiddleware');

// Rotas Públicas
router.post('/login', userController.login);
router.post('/', validateUser, userController.create);

// Rotas Protegidas
router.get('/', authMiddleware, userController.findAll);
router.get('/:id', authMiddleware, userController.findById);
router.put('/:id', authMiddleware, validateUser, userController.update);
router.delete('/:id', authMiddleware, userController.delete);

module.exports = router;