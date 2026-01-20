const salarioModel = require('../models/salarioModel');

module.exports = {
  create: (data, callback) => {
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

  findByIdAndUser: (id, userId, callback) => {
    salarioModel.findByIdAndUser(id, userId, callback);
  },

  update: (id, data, callback) => {
    salarioModel.update(id, data, callback);
  },

  updateByIdAndUser: (id, userId, data, callback) => {
    salarioModel.updateByIdAndUser(id, userId, data, callback);
  },

  delete: (id, callback) => {
    salarioModel.remove(id, callback);
  },

  deleteByIdAndUser: (id, userId, callback) => {
    salarioModel.removeByIdAndUser(id, userId, callback);
  },
};
