const userService = require('../services/userService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  login(req, res) {
    if (req.passo) req.passo('🔑', 'Tentativa de Login');
    userService.login(req.body.email, req.body.senha, (err, result) => {
      if (err) return sendError(res, err);
      if (req.passo) req.passo('✅', 'Login Sucesso');
      return res.json(result);
    });
  },

  create(req, res) {
    if (req.passo) req.passo('⚙️', 'Criando Usuário');
    userService.create(req.body, (err, result) => {
      if (err) return sendError(res, err);
      if (req.passo) req.passo('💾', 'Usuário Salvo');
      return res.status(201).json({ message: 'Criado', id: result.insertId });
    });
  },

  findAll(req, res) {
    userService.findAll((err, r) => {
      if (err) return sendError(res, err);
      return res.json(r);
    });
  },

  findById(req, res) {
    userService.findById(req.params.id, (err, r) => {
      if (err) return sendError(res, err);
      return res.json(r);
    });
  },

  update(req, res) {
    userService.update(req.params.id, req.body, (err, r) => {
      if (err) return sendError(res, err);
      return res.json(r);
    });
  },

  delete(req, res) {
    userService.delete(req.params.id, (err, r) => {
      if (err) return sendError(res, err);
      return res.json(r);
    });
  },
};
