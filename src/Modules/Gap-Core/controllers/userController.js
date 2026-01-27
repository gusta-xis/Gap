const userService = require('../services/userService');
const userModel = require('../models/userModel'); // Needed for direct admin access
const bcrypt = require('bcryptjs'); // Needed for direct hashing in admin creation
const jwt = require('jsonwebtoken'); // Needed for token generation
const { sendError } = require('../../../utils/errorHandler');

// Role Weights (Must match hierarchyMiddleware)
const ROLE_WEIGHTS = {
  'super_admin': 3,
  'manager': 2,
  'admin': 1,
  'user': 0
};

/**
 * Gets the weight of a role.
 * @param {string} role 
 * @returns {number}
 */
const getRoleWeight = (role) => {
  return ROLE_WEIGHTS[role] !== undefined ? ROLE_WEIGHTS[role] : 0;
};

module.exports = {
  login(req, res) {
    const { login, senha } = req.body; // Accepts 'login' instead of 'email'

    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios' });
    }

    // Search by email OR credential
    userService.findByEmailOrCredential(login, async (err, user) => {
      if (err) return sendError(res, err);

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (user.senha === null) {
        return res.status(403).json({ error: 'Conta não ativada. Use a opção de Primeiro Acesso.' });
      }

      const isMatch = await bcrypt.compare(senha, user.senha);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, credential: user.credential },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso',
        token,
        refreshToken,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          credential: user.credential
        }
      });
    });
  },

  checkCredential(req, res) {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Credencial é obrigatória' });

    // Clean input
    const cred = credential.trim().toUpperCase();

    userModel.findByEmailOrCredential(cred, (err, user) => {
      if (err) return sendError(res, err);

      // Return 404 for security if not found
      if (!user) return res.status(404).json({ error: 'Credencial não encontrada' });

      // If found, check if it's first access (password is null)
      return res.json({
        exists: true,
        firstAccess: user.senha === null,
        nome: user.nome
      });
    });
  },

  activateCredential(req, res) {
    const { credential, newPassword } = req.body;
    if (!credential || !newPassword) return res.status(400).json({ error: 'Dados incompletos' });

    const cred = credential.trim().toUpperCase();

    userModel.findByEmailOrCredential(cred, (err, user) => {
      if (err) return sendError(res, err);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      // Only allow activation if password is NULL
      if (user.senha !== null) {
        return res.status(400).json({ error: 'Conta já está ativa. Por favor, faça login.' });
      }

      bcrypt.hash(newPassword, 10, (errHash, hashedPassword) => {
        if (errHash) return sendError(res, errHash);

        // Update password
        userModel.updatePassword(user.id, hashedPassword, (upErr) => {
          if (upErr) return sendError(res, upErr);
          res.json({ message: 'Conta ativada com sucesso! Por favor, faça login.' });
        });
      });
    });
  },

  refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Token de atualização é obrigatório'
      });
    }

    userService.refreshAccessToken(refreshToken, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    });
  },

  create(req, res) {
    // Public creation (checking for users logic?)
    // Assuming public registration creates standard 'user'
    userService.create(req.body, (err, result) => {
      if (err) return sendError(res, err);

      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        id: result.insertId
      });
    });
  },

  findAll(req, res) {
    userService.findAll((err, r) => {
      if (err) return sendError(res, err);
      return res.json(r);
    });
  },

  findById(req, res) {
    // Self-access check
    if (parseInt(req.params.id, 10) !== req.user.id) {
      // Could allow admins to view others, but logic seems strict to self for now on this endpoint?
      // Existing code was strictly: id !== req.user.id -> 403
      return res.status(403).json({ error: 'Acesso negado' });
    }

    userService.findById(req.params.id, (err, r) => {
      if (err) return sendError(res, err);

      if (!r) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      return res.json(r);
    });
  },

  update(req, res) {
    const userId = parseInt(req.params.id, 10);
    // Usually users update themselves.
    // hierarchyMiddleware is present. Admin updating data?
    // Maintaining existing logic that seems to imply self-update unless specified otherwise.
    // If we want hierarchical update, we would check weights.
    // For now, assuming self-update or leaving as is.
    userService.update(userId, req.body, (err, r) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Usuário atualizado com sucesso'
      });
    });
  },

  delete(req, res) {
    // Only self-delete? Or generic delete?
    // userController.delete usually mapped to /:id which is self or admin?
    // Existing route was /:id.
    userService.delete(req.params.id, (err, r) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Usuário deletado com sucesso'
      });
    });
  },

  forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    userService.generatePasswordResetCode(email, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({
        message: result.message
      });
    });
  },

  verifyCode(req, res) {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }

    userService.verifyResetCode(email, code, (err, result) => {
      if (err) return sendError(res, err);
      return res.json({ valid: true });
    });
  },

  resetPassword(req, res) {
    const { email, code, newPassword } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, código e nova senha são obrigatórios' });
    }

    userService.resetPassword(email, code, newPassword, ipAddress, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({ message: 'Senha redefinida com sucesso' });
    });
  },

  // --- Admin Functions ---

  adminListUsers(req, res) {
    userModel.findAll((err, users) => {
      if (err) return sendError(res, err);
      const cleanUsers = users.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        credential: u.credential
      }));
      res.json(cleanUsers);
    });
  },

  adminCreateUser(req, res) {
    const { nome, role, email } = req.body;

    // Hierarchy Validation: Golden Rule (Creator Weight > New Role Weight)
    const creatorWeight = req.user.weight;
    const newRoleWeight = getRoleWeight(role);

    if (creatorWeight <= newRoleWeight) {
      return res.status(403).json({ error: 'Permissão insuficiente para criar um usuário com esta função.' });
    }

    // Additional check: Ensure 'user' is the minimum weight (handled by logic, but robust)
    if (!['admin', 'manager', 'super_admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Função inválida' });
    }

    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    const userData = { nome, senha: null, role, email };

    if (role === 'admin' || role === 'manager' || role === 'super_admin') {
      // Create admin/manager with credential
      userModel.createAdmin(userData, (err, result) => {
        if (err) return sendError(res, err);
        const roleName = role === 'manager' ? 'Manager' : (role === 'super_admin' ? 'Super Admin' : 'Administrator');
        res.status(201).json({
          message: `${roleName} criado com sucesso (Aguardando Ativação)`,
          credential: result.credential
        });
      });
    } else {
      // Create standard user
      const { senha } = req.body;
      if (!senha) return res.status(400).json({ error: 'Senha obrigatória para usuários padrão' });

      bcrypt.hash(senha, 10, (errHash, hashedPassword) => {
        if (errHash) return sendError(res, errHash);
        userData.senha = hashedPassword;

        userModel.create(userData, (err, result) => {
          if (err) return sendError(res, err);
          res.status(201).json({ message: 'Usuário criado com sucesso' });
        });
      });
    }
  },

  adminDeleteUser(req, res) {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: 'Não é possível deletar a si mesmo.' });

    userModel.findById(id, (err, targetUser) => {
      if (err) return sendError(res, err);
      if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

      const myWeight = req.user.weight;
      const targetWeight = getRoleWeight(targetUser.role);

      // Hierarchy Rule: My Weight must be strictly greater than Target Weight
      if (myWeight <= targetWeight) {
        return res.status(403).json({ error: 'Você não tem permissão para deletar este usuário.' });
      }

      userModel.remove(id, (delErr) => {
        if (delErr) return sendError(res, delErr);
        res.json({ message: 'Usuário deletado com sucesso' });
      });
    });
  },

  adminUpdateRole(req, res) {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    // Strict check: Only Super Admin can update roles arbitrarily? 
    // Or use hierarchy? "myWeight > targetCurrentWeight AND myWeight > newRoleWeight"
    // Existing code was strictly Super Admin.
    // Retaining Super Admin strictness for role updates provides stability, but let's see if hierarchy applies.
    // User didn't explicitly request refactoring this, but "Refatorar os controllers".
    // I will stick to Super Admin (Weight 3) for simplicity and safety on Role Updates, or use strict hierarchy.
    // Given the prompt "Regra de Ouro" applied to "create or delete" (Phase 3.2), I will apply it here too for consistency.

    // Actually, sticking to the existing "req.user.role !== 'super_admin'" check is equivalent to "weight < 3" check.
    // But let's use weight logic for consistency if possible.
    // However, existing code was: if (req.user.role !== 'super_admin') return 403.
    // I will keep it simple: Only Super Admin (Weight 3).

    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Permissão  insuficiente.' });

    if (!['user', 'admin', 'manager'].includes(role)) return res.status(400).json({ error: 'Função inválida.' });

    userModel.update(id, { role }, (err) => {
      if (err) return sendError(res, err);
      res.json({ message: `Função atualizada para ${role}` });
    });
  },
};
