const salarioService = require('../services/salarioService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  create(req, res) {
    const dados = { ...req.body, user_id: req.user.id };

    salarioService.create(dados, (err, result) => {
      if (err) return sendError(res, err);



      return res.status(201).json({
        message: 'Salário criado com sucesso',
        id: result.insertId
      });
    });
  },

  findAll(req, res) {
    salarioService.findAll((err, rows) => {
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

    salarioService.findByIdAndUser(id, req.user.id, (err, row) => {
      if (err) return sendError(res, err);

      if (!row) {
        return res.status(403).json({
          error: 'Acesso negado ou salário não encontrado'
        });
      }

      return res.status(200).json(row);
    });
  },

  findByUserId(req, res) {
    const userId = req.user.id;

    salarioService.findByUserId(userId, (err, rows) => {
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

    salarioService.updateByIdAndUser(id, req.user.id, req.body, (err, result) => {
      if (err) return sendError(res, err);

      if (result.affectedRows === 0) {
        return res.status(403).json({
          error: 'Acesso negado ou salário não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Salário atualizado com sucesso'
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

    salarioService.deleteByIdAndUser(id, req.user.id, (err, result) => {
      if (err) return sendError(res, err);

      if (result.affectedRows === 0) {
        return res.status(403).json({
          error: 'Acesso negado ou salário não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Salário deletado com sucesso'
      });
    });
  },
};
