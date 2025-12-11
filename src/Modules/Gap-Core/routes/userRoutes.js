// ========================================================
// USER ROUTES - COM REFRESH TOKEN E RATE LIMITING
// ========================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser, validateResetPassword } = require('../middlewares/userMiddleware');
const authMiddleware = require('../../../middlewares/authMiddleware');

// ========== ROTAS PÚBLICAS ==========
// POST /api/v1/users/login - Login (rate limited no server.js)
router.post('/login', userController.login);

// POST /api/v1/users - Cadastro (rate limited no server.js)
router.post('/', validateUser, userController.create);

// POST /api/v1/users/refresh - Refresh Token (sem auth, usa refresh token do body)
router.post('/refresh', userController.refreshToken);

// POST /api/v1/users/forgot-password - Solicitar recuperação de senha
router.post('/forgot-password', userController.forgotPassword);

// POST /api/v1/users/reset-password - Resetar senha com token
router.post('/reset-password', validateResetPassword, userController.resetPassword);

// ========== ROTAS PROTEGIDAS (Requerem Access Token) ==========
// GET /api/v1/users - Listar todos (apenas admin)
router.get('/', authMiddleware, userController.findAll);

// GET /api/v1/users/:id - Buscar por ID
router.get('/:id', authMiddleware, userController.findById);

// PUT /api/v1/users/:id - Atualizar
router.put('/:id', authMiddleware, validateUser, userController.update);

// DELETE /api/v1/users/:id - Deletar
router.delete('/:id', authMiddleware, userController.delete);

module.exports = router;
