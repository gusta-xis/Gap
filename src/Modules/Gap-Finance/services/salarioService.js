const salarioModel = require('../models/salarioModel');

module.exports = {
  create: (data, callback) => {
    // Aqui você pode adicionar regras de negócio se precisar
    salarioModel.create(data, callback);
  },

  findAll: (callback) => {
    salarioModel.findAll(callback);
  },

  findByUserId: (userId, callback) => {
    salarioModel.findByUserId(userId, callback);
  },

  findById: (id, callback) => {
    salarioModel.findById(id, callback);
  },

  update: (id, data, callback) => {
    salarioModel.update(id, data, callback);
  },

  delete: (id, callback) => {
    salarioModel.remove(id, callback);
  }
};