const salarioService = require('../services/salarioService');

module.exports = {
  create(req, res) {
    salarioService.create(req.body, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      req.passo('💾', `Salvo no Banco (ID: ${result.insertId || 'Múltiplos'})`);
      
      res.status(201).json({ message: 'Criado com sucesso', id: result.insertId });
    });
  },

  findAll(req, res) {
    salarioService.findAll((err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(rows);
    });
  },

  findById(req, res) {
    salarioService.findById(req.params.id, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ message: 'Salario não encontrado' });
      res.status(200).json(row);
    });
  },

  findByUserId(req, res) {
    // Pegando em via Query Param (?user_id=...)
    salarioService.findByUserId(req.query.user_id, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ message: 'Salario não encontrado' });
      res.status(200).json(row);
    });
  },

  update(req, res) {
    salarioService.update(req.params.id, req.body, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Dados atualizados com sucesso' });
    });
  },

  delete(req, res) {
    salarioService.delete(req.params.id, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Salario deletado com sucesso' });
    });
  }
};