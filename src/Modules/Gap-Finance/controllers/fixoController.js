const fixoService = require('../services/fixoService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  create(req, res) {


    // Validação dos campos obrigatórios
    const { nome, valor, categoria_id, dia_vencimento } = req.body;
    if (!nome || !valor || !dia_vencimento) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, valor, categoria_id, dia_vencimento.'
      });
    }

    const dados = { ...req.body, user_id: req.user.id };

    fixoService.create(dados, (err, result) => {
      if (err) return sendError(res, err);



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
    const userId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const dados = { ...req.body, user_id: userId };
    fixoService.updateByIdAndUser(id, userId, dados, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result || result.affectedRows === 0) return res.status(404).json({ error: 'Gasto fixo não encontrado' });
      res.json({ success: true });
    });
  },

  delete(req, res) {
    const id = parseInt(req.params.id, 10);
    const userId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    fixoService.removeByIdAndUser(id, userId, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result || result.affectedRows === 0) return res.status(404).json({ error: 'Gasto fixo não encontrado' });
      res.json({ success: true });
    });
  },
};
