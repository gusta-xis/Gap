const variaveisModel = require('../models/variaveisModel');

module.exports = {
  create: (data, callback) => {
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

  findByIdAndUser: (id, userId, callback) => {
    variaveisModel.findByIdAndUser(id, userId, callback);
  },

  update: (id, data, callback) => {
    variaveisModel.update(id, data, callback);
  },

  updateByIdAndUser: (id, userId, data, callback) => {
    variaveisModel.updateByIdAndUser(id, userId, data, callback);
  },

  delete: (id, callback) => {
    variaveisModel.remove(id, callback);
  },

  deleteByIdAndUser: (id, userId, callback) => {
    variaveisModel.removeByIdAndUser(id, userId, callback);
  },
};
