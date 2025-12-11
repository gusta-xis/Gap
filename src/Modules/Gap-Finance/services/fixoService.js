const fixoModel = require('../models/fixoModel');

module.exports = {
  create: (data, callback) => {
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

  findByIdAndUser: (id, userId, callback) => {
    fixoModel.findByIdAndUser(id, userId, callback);
  },

  update: (id, data, callback) => {
    fixoModel.update(id, data, callback);
  },

  updateByIdAndUser: (id, userId, data, callback) => {
    fixoModel.updateByIdAndUser(id, userId, data, callback);
  },

  delete: (id, callback) => {
    fixoModel.remove(id, callback);
  },

  deleteByIdAndUser: (id, userId, callback) => {
    fixoModel.removeByIdAndUser(id, userId, callback);
  },
};
