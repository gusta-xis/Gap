const userModel = require('../models/userModel');

module.exports = {

  create(data, callback) {
    // Regra de negócio: Verifica se é um cadastro em massa ou único
    if (Array.isArray(data)) {
      return userModel.createMany(data, callback);
    }
    userModel.create(data, callback);
  },

  findAll(callback) {
    userModel.findAll(callback);
  },

  findById(id, callback) {
    userModel.findById(id, callback);
  },

  findByEmail(email, callback) {
    userModel.findByEmail(email, callback);
  },

  update(id, data, callback) {
    // Aqui você poderia colocar regras, ex: verificar se o email mudou
    userModel.update(id, data, callback);
  },

  delete(id, callback) {
    userModel.remove(id, callback);
  }
};