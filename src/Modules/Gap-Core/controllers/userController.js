const userService = require('../services/userService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  login(req, res) {
    if (req.passo) req.passo('🔑', 'Tentativa de Login');

    userService.login(req.body.email, req.body.senha, (err, result) => {
      if (err) return sendError(res, err);

      if (req.passo) req.passo('✅', 'Login Sucesso');

      return res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    });
  },

  refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token obrigatório'
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
    if (req.passo) req.passo('⚙️', 'Criando Usuário');

    userService.create(req.body, (err, result) => {
      if (err) return sendError(res, err);

      if (req.passo) req.passo('💾', 'Usuário Salvo');

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
    if (parseInt(req.params.id, 10) !== req.user.id) {
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
    userService.update(req.params.id, req.body, (err, r) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Usuário atualizado com sucesso'
      });
    });
  },

  delete(req, res) {
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
      return res.status(400).json({
        error: 'Email obrigatório'
      });
    }

    userService.generatePasswordResetToken(email, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Se o email existir, um link de recuperação será enviado.',
        token: result.token
      });
    });
  },

  resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token e nova senha são obrigatórios'
      });
    }

    userService.resetPassword(token, newPassword, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Senha redefinida com sucesso'
      });
    });
  },
};
