const variaveisService = require('../services/variaveisService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  create(req, res) {
    if (req.passo) req.passo('⚙️', 'Criando Variável');

    const dados = { ...req.body, user_id: req.user.id };

    // Garantir categoria opcional como null se vier vazia
    if (!dados.categoria_id) dados.categoria_id = null;

    variaveisService.create(dados, (err, result) => {
      if (err) return sendError(res, err);
      if (req.passo) req.passo('💾', `Salvo no Banco (ID: ${result.insertId})`);
      return res
        .status(201)
        .json({ message: 'Criado com sucesso', id: result.insertId });
    });
  },

  findByUserId(req, res) {
    const id = req.user.id;

    variaveisService.findByUserId(id, (err, rows) => {
      if (err) return sendError(res, err);
      return res.status(200).json(rows);
    });
  },

  findAll(req, res) {
    variaveisService.findAll((err, rows) => {
      if (err) return sendError(res, err);
      return res.status(200).json(rows);
    });
  },

  findById(req, res) {
    variaveisService.findById(req.params.id, (err, row) => {
      if (err) return sendError(res, err);
      if (!row)
        return res.status(404).json({ message: 'Registro não encontrado' });
      return res.status(200).json(row);
    });
  },

  update(req, res) {
    variaveisService.update(req.params.id, req.body, (err) => {
      if (err) return sendError(res, err);
      return res.status(200).json({ message: 'Dados atualizados com sucesso' });
    });
  },

  delete(req, res) {
    variaveisService.delete(req.params.id, (err) => {
      if (err) return sendError(res, err);
      return res.status(200).json({ message: 'Registro deletado com sucesso' });
    });
  },
};
