const metasService = require('../services/metasService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  create(req, res) {
    if (req.passo) req.passo('⚙️', 'Criando Meta');

    // Validação dos campos obrigatórios
    const { nome, valor_alvo, prazo } = req.body;
    if (!nome || !valor_alvo || !prazo) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, valor_alvo, prazo.'
      });
    }

    const dados = { ...req.body, user_id: req.user.id };

    metasService.create(dados, (err, result) => {
      if (err) return sendError(res, err);

      if (req.passo) req.passo('💾', `Salvo no Banco (ID: ${result.insertId})`);

      return res.status(201).json({
        message: 'Meta criada com sucesso',
        id: result.insertId,
      });
    });
  },

  findAll(req, res) {
    metasService.findAll((err, rows) => {
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

    metasService.findByIdAndUser(id, req.user.id, (err, row) => {
      if (err) return sendError(res, err);

      if (!row) {
        return res.status(403).json({
          error: 'Acesso negado ou meta não encontrada'
        });
      }

      return res.status(200).json(row);
    });
  },

  findByUserId(req, res) {
    const userId = req.user.id;

    metasService.findByUserId(userId, (err, rows) => {
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
    metasService.updateByIdAndUser(id, userId, dados, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result || result.affectedRows === 0) return res.status(404).json({ error: 'Meta não encontrada' });
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
    metasService.removeByIdAndUser(id, userId, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result || result.affectedRows === 0) return res.status(404).json({ error: 'Meta não encontrada' });
      res.json({ success: true });
    });
  },
};