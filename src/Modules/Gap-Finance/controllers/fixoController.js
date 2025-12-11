const fixoService = require('../services/fixoService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  create(req, res) {
    if (req.passo) req.passo('⚙️', 'Criando Gasto Fixo');

    const dados = { ...req.body, user_id: req.user.id };

    fixoService.create(dados, (err, result) => {
      if (err) return sendError(res, err);

      if (req.passo) req.passo('💾', `Salvo no Banco (ID: ${result.insertId})`);

      return res.status(201).json({
        message: 'Gasto fixo criado com sucesso',
        id: result.insertId,
      });
    });
  },

  findAll(req, res) {
    fixoService.findAll((err, rows) => {
      if (err) return sendError(res, err);
      return res.status(200).json(rows);
    });
  },

  findById(req, res) {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    fixoService.findByIdAndUser(id, req.user.id, (err, row) => {
      if (err) return sendError(res, err);

      if (!row) {
        return res.status(403).json({
          error: 'Acesso negado ou gasto não encontrado'
        });
      }

      return res.status(200).json(row);
    });
  },

  findByUserId(req, res) {
    const userId = req.user.id;

    fixoService.findByUserId(userId, (err, rows) => {
      if (err) return sendError(res, err);

      return res.status(200).json(rows || []);
    });
  },

  update(req, res) {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    fixoService.updateByIdAndUser(id, req.user.id, req.body, (err, result) => {
      if (err) return sendError(res, err);

      if (result.affectedRows === 0) {
        return res.status(403).json({
          error: 'Acesso negado ou gasto não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Gasto fixo atualizado com sucesso'
      });
    });
  },

  delete(req, res) {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    fixoService.deleteByIdAndUser(id, req.user.id, (err, result) => {
      if (err) return sendError(res, err);

      if (result.affectedRows === 0) {
        return res.status(403).json({
          error: 'Acesso negado ou gasto não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Gasto fixo deletado com sucesso'
      });
    });
  },
};
