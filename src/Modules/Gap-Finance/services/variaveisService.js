const variaveisModel = require('../models/variaveisModel');

module.exports = {
  create: (data, callback) => {
    // Aqui você pode adicionar regras de negócio se precisar
    variaveisModel.create(data, callback);
  },

  findAll: (callback) => {
    variaveisModel.findAll(callback);
  },

  findByUserId: (userId, callback) => {
    variaveisModel.findByUserId(userId, callback);
  },

  findById: (id, callback) => {
    variaveisModel.findById(id, callback);
  },

  update: (id, data, callback) => {
    variaveisModel.update(id, data, callback);
  },

  delete: (id, callback) => {
    variaveisModel.remove(id, callback);
  },
};
