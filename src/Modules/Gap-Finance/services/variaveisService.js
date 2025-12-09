const fixoModel = require('../models/fixoModel');

module.exports = {
  create: (data, callback) => {
    // Aqui você pode adicionar regras de negócio se precisar
    fixoModel.create(data, callback);
  },

  findAll: (callback) => {
    fixoModel.findAll(callback);
  },

  findByUserId: (userId, callback) => {
    fixoModel.findByUserId(userId, callback);
  },

  findById: (id, callback) => {
    fixoModel.findById(id, callback);
  },

  update: (id, data, callback) => {
    fixoModel.update(id, data, callback);
  },

  delete: (id, callback) => {
    fixoModel.remove(id, callback);
  },
};
