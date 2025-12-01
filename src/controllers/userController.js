const userService = require('../services/userService');

module.exports = {
  create(req, res) {
    userService.create(req.body, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      req.passo('💾', `Salvo no Banco (ID: ${result.insertId || 'Múltiplos'})`);
      
      res.status(201).json({ message: 'Criado com sucesso', id: result.insertId });
    });
  },

  findAll(req, res) {
    userService.findAll((err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(rows);
    });
  },

  findById(req, res) {
    userService.findById(req.params.id, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ message: 'Usuário não encontrado' });
      res.status(200).json(row);
    });
  },

  findByEmail(req, res) {
    // Pegando email via Query Param (?email=...)
    userService.findByEmail(req.query.email, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ message: 'Usuário não encontrado' });
      res.status(200).json(row);
    });
  },

  update(req, res) {
    userService.update(req.params.id, req.body, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Dados atualizados com sucesso' });
    });
  },

  delete(req, res) {
    userService.delete(req.params.id, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Usuário deletado com sucesso' });
    });
  }
};