const fixoService = require('../services/fixoService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  create(req, res) {
    // Log visual de início
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

  // Busca todos (Geralmente para Admin ou relatórios gerais)
  findAll(req, res) {
    fixoService.findAll((err, rows) => {
      if (err) return sendError(res, err);
      return res.status(200).json(rows);
    });
  },

  findById(req, res) {
    fixoService.findById(req.params.id, (err, row) => {
      if (err) return sendError(res, err);
      if (!row)
        return res.status(404).json({ message: 'Gasto fixo não encontrado' });
      return res.status(200).json(row);
    });
  },

  // Busca APENAS os gastos do usuário logado
  findByUserId(req, res) {
    // Em vez de pedir na URL, pegamos do Token!
    const id = req.user.id;

    fixoService.findByUserId(id, (err, rows) => {
      if (err) return sendError(res, err);

      // Nota: Se não tiver gastos, retorna array vazio [] (Status 200), não erro 404.
      // Isso é o padrão correto para listas.
      return res.status(200).json(rows);
    });
  },

  update(req, res) {
    fixoService.update(req.params.id, req.body, (err) => {
      if (err) return sendError(res, err);
      return res.status(200).json({ message: 'Dados atualizados com sucesso' });
    });
  },

  delete(req, res) {
    fixoService.delete(req.params.id, (err) => {
      if (err) return sendError(res, err);
      return res
        .status(200)
        .json({ message: 'Gasto fixo deletado com sucesso' });
    });
  },
};
