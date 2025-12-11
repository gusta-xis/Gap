const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser, validateResetPassword } = require('../middlewares/userMiddleware');
const authMiddleware = require('../../../middlewares/authMiddleware');

router.post('/login', userController.login);

router.post('/', validateUser, userController.create);

router.post('/refresh', userController.refreshToken);

router.post('/forgot-password', userController.forgotPassword);

router.post('/reset-password', validateResetPassword, userController.resetPassword);

router.get('/', authMiddleware, userController.findAll);

router.get('/:id', authMiddleware, userController.findById);

router.put('/:id', authMiddleware, validateUser, userController.update);

router.delete('/:id', authMiddleware, userController.delete);

module.exports = router;
