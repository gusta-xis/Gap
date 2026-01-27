const { verifyAdmin, verifySuperAdmin } = require('../middlewares/adminMiddleware');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser, validateResetPassword } = require('../middlewares/userMiddleware');
const authMiddleware = require('../../../middlewares/authMiddleware');
const hierarchyMiddleware = require('../../../middlewares/hierarchyMiddleware');
const db = require('../../../config/db');

router.post('/login', userController.login);

router.post('/', validateUser, userController.create);

router.post('/refresh', userController.refreshToken);

router.post('/forgot-password', userController.forgotPassword);


// --- Admin Routes ---
// Note: verifySuperAdmin replaced by verifyAdmin in some places to allow Hierarchy Logic (in controller) to handle permissions.
router.get('/admin/list', authMiddleware, hierarchyMiddleware, verifyAdmin, userController.adminListUsers);
router.post('/admin/create', authMiddleware, hierarchyMiddleware, verifyAdmin, userController.adminCreateUser);
router.delete('/admin/:id', authMiddleware, hierarchyMiddleware, verifyAdmin, userController.adminDeleteUser);
router.patch('/admin/:id/role', authMiddleware, hierarchyMiddleware, verifySuperAdmin, userController.adminUpdateRole);

router.post('/verify-code', userController.verifyCode);
router.post('/check-credential', userController.checkCredential);
router.post('/activate-credential', userController.activateCredential);

router.post('/reset-password', validateResetPassword, userController.resetPassword);

router.get('/', authMiddleware, hierarchyMiddleware, userController.findAll);

router.get('/:id', authMiddleware, hierarchyMiddleware, userController.findById);

router.put('/:id', authMiddleware, hierarchyMiddleware, validateUser, userController.update);

router.delete('/:id', authMiddleware, hierarchyMiddleware, userController.delete);

router.put('/:id/introducao-vista', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE users SET introducao_vista = 1 WHERE id = ?', [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar introducao_vista' });
  }
});

module.exports = router;
