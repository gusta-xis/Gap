const userService = require('../services/userService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  login(req, res) {


    userService.login(req.body.email, req.body.senha, (err, result) => {
      if (err) return sendError(res, err);



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
    const userId = parseInt(req.params.id, 10);
    userService.update(userId, req.body, (err, r) => {
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
      return res.status(400).json({ error: 'Email obrigatório' });
    }

    userService.generatePasswordResetCode(email, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({
        message: result.message
        // token: result.token (Removido, usamos código por email agora)
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
};
