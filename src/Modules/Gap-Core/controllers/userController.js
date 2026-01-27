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
      return res.status(400).json({ error: 'Login and password are required' });
    }

    // Search by email OR credential
    userService.findByEmailOrCredential(login, async (err, user) => {
      if (err) return sendError(res, err);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.senha === null) {
        return res.status(403).json({ error: 'Account not activated. Use First Access option.' });
      }

      const isMatch = await bcrypt.compare(senha, user.senha);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
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
        message: 'Login successful',
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
    if (!credential) return res.status(400).json({ error: 'Credential is required' });

    // Clean input
    const cred = credential.trim().toUpperCase();

    userModel.findByEmailOrCredential(cred, (err, user) => {
      if (err) return sendError(res, err);

      // Return 404 for security if not found
      if (!user) return res.status(404).json({ error: 'Credential not found' });

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
    if (!credential || !newPassword) return res.status(400).json({ error: 'Incomplete data' });

    const cred = credential.trim().toUpperCase();

    userModel.findByEmailOrCredential(cred, (err, user) => {
      if (err) return sendError(res, err);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Only allow activation if password is NULL
      if (user.senha !== null) {
        return res.status(400).json({ error: 'Account already active. Please login.' });
      }

      bcrypt.hash(newPassword, 10, (errHash, hashedPassword) => {
        if (errHash) return sendError(res, errHash);

        // Update password
        userModel.updatePassword(user.id, hashedPassword, (upErr) => {
          if (upErr) return sendError(res, upErr);
          res.json({ message: 'Account activated successfully! Please login.' });
        });
      });
    });
  },

  refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required'
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
        message: 'User created successfully',
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
      return res.status(403).json({ error: 'Access denied' });
    }

    userService.findById(req.params.id, (err, r) => {
      if (err) return sendError(res, err);

      if (!r) {
        return res.status(404).json({
          error: 'User not found'
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
        message: 'User updated successfully'
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
        message: 'User deleted successfully'
      });
    });
  },

  forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
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
      return res.status(400).json({ error: 'Email and code are required' });
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
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    userService.resetPassword(email, code, newPassword, ipAddress, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({ message: 'Password reset successfully' });
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
      return res.status(403).json({ error: 'Insufficient permission to create a user with this role.' });
    }

    // Additional check: Ensure 'user' is the minimum weight (handled by logic, but robust)
    if (!['admin', 'manager', 'super_admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userData = { nome, senha: null, role, email };

    if (role === 'admin' || role === 'manager' || role === 'super_admin') {
      // Create admin/manager with credential
      userModel.createAdmin(userData, (err, result) => {
        if (err) return sendError(res, err);
        const roleName = role === 'manager' ? 'Manager' : (role === 'super_admin' ? 'Super Admin' : 'Administrator');
        res.status(201).json({
          message: `${roleName} created successfully (Waiting for Activation)`,
          credential: result.credential
        });
      });
    } else {
      // Create standard user
      const { senha } = req.body;
      if (!senha) return res.status(400).json({ error: 'Password required for standard users' });

      bcrypt.hash(senha, 10, (errHash, hashedPassword) => {
        if (errHash) return sendError(res, errHash);
        userData.senha = hashedPassword;

        userModel.create(userData, (err, result) => {
          if (err) return sendError(res, err);
          res.status(201).json({ message: 'User created successfully' });
        });
      });
    }
  },

  adminDeleteUser(req, res) {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });

    userModel.findById(id, (err, targetUser) => {
      if (err) return sendError(res, err);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });

      const myWeight = req.user.weight;
      const targetWeight = getRoleWeight(targetUser.role);

      // Hierarchy Rule: My Weight must be strictly greater than Target Weight
      if (myWeight <= targetWeight) {
        return res.status(403).json({ error: 'You do not have permission to delete this user.' });
      }

      userModel.remove(id, (delErr) => {
        if (delErr) return sendError(res, delErr);
        res.json({ message: 'User deleted successfully' });
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

    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Insufficient permission.' });

    if (!['user', 'admin', 'manager'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });

    userModel.update(id, { role }, (err) => {
      if (err) return sendError(res, err);
      res.json({ message: `Role updated to ${role}` });
    });
  },
};
