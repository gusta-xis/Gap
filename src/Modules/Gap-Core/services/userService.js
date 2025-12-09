const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

module.exports = {
  login: (email, senha, callback) => {
    userModel.findByEmail(email, (err, user) => {
      if (err) return callback({ status: 500, message: 'Erro banco' });
      if (!user) return callback({ status: 401, message: 'Credenciais inválidas' });

      // Compara o hash da senha armazenada com a senha fornecida
      bcrypt.compare(senha, user.senha, (compareErr, same) => {
        if (compareErr) return callback({ status: 500, message: 'Erro ao verificar senha' });
        if (!same) return callback({ status: 401, message: 'Credenciais inválidas' });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        callback(null, { token, user: { id: user.id, nome: user.nome, email: user.email } });
      });
    });
  },

  create: (data, cb) => {
    // Se for uma lista, hashear todas as senhas antes de inserir
    if (Array.isArray(data)) {
      // Usa Promise.all para hashear em paralelo
      Promise.all(data.map(u => bcrypt.hash(u.senha, 10).then(hash => ({ ...u, senha: hash }))))
        .then(hashedList => userModel.createMany(hashedList, cb))
        .catch(err => cb(err));
      return;
    }

    // Caso único
    bcrypt.hash(data.senha, 10, (err, hash) => {
      if (err) return cb(err);
      const toSave = { ...data, senha: hash };
      userModel.create(toSave, cb);
    });
  },

  findAll: (cb) => userModel.findAll(cb),
  findById: (id, cb) => userModel.findById(id, cb),
  update: (id, data, cb) => userModel.update(id, data, cb),
  delete: (id, cb) => userModel.remove(id, cb)
};