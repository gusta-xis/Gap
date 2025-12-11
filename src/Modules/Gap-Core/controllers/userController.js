// ========================================================
// USER CONTROLLER - COM REFRESH TOKEN
// ========================================================

const userService = require('../services/userService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  /**
   * Login - Retorna Access Token + Refresh Token
   */
  login(req, res) {
    if (req.passo) req.passo('🔑', 'Tentativa de Login');

    userService.login(req.body.email, req.body.senha, (err, result) => {
      if (err) return sendError(res, err);

      if (req.passo) req.passo('✅', 'Login Sucesso');

      // Retorna tokens e dados do usuário
      return res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    });
  },

  /**
   * Refresh Token - Gera novo Access Token
   */
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

  /**
   * Create - Cria novo usuário
   */
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

  /**
   * Find All - Lista todos os usuários (admin only)
   */
  findAll(req, res) {
    userService.findAll((err, r) => {
      if (err) return sendError(res, err);
      return res.json(r);
    });
  },

  /**
   * Find By ID - Busca usuário por ID
   */
  findById(req, res) {
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

  /**
   * Update - Atualiza usuário
   */
  update(req, res) {
    userService.update(req.params.id, req.body, (err, r) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Usuário atualizado com sucesso'
      });
    });
  },

  /**
   * Delete - Deleta usuário
   */
  delete(req, res) {
    userService.delete(req.params.id, (err, r) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Usuário deletado com sucesso'
      });
    });
  },
};
