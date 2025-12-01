const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = {
  login: (email, senha, callback) => {
    userModel.findByEmail(email, (err, user) => {
      if (err) return callback({ status: 500, message: 'Erro banco' });
      if (!user || user.senha !== senha) return callback({ status: 401, message: 'Credenciais inválidas' });

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      callback(null, { token, user: { id: user.id, nome: user.nome, email: user.email } });
    });
  },
  create: (data, cb) => Array.isArray(data) ? userModel.createMany(data, cb) : userModel.create(data, cb),
  findAll: (cb) => userModel.findAll(cb),
  findById: (id, cb) => userModel.findById(id, cb),
  update: (id, data, cb) => userModel.update(id, data, cb),
  delete: (id, cb) => userModel.remove(id, cb)
};