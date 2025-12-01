const userService = require('../services/userService');

module.exports = {
  login(req, res) {
    if(req.passo) req.passo('🔑', 'Tentativa de Login');
    userService.login(req.body.email, req.body.senha, (err, result) => {
      if (err) return res.status(err.status).json({ error: err.message });
      if(req.passo) req.passo('✅', 'Login Sucesso');
      res.json(result);
    });
  },
  create(req, res) {
    if(req.passo) req.passo('⚙️', 'Criando Usuário');
    userService.create(req.body, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if(req.passo) req.passo('💾', 'Usuário Salvo');
      res.status(201).json({ message: 'Criado', id: result.insertId });
    });
  },
  findAll(req, res) { userService.findAll((err, r) => res.json(r)); },
  findById(req, res) { userService.findById(req.params.id, (err, r) => res.json(r)); },
  update(req, res) { userService.update(req.params.id, req.body, (err, r) => res.json(r)); },
  delete(req, res) { userService.delete(req.params.id, (err, r) => res.json(r)); }
};