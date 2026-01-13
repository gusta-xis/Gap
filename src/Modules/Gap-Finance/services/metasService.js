const metaModel = require('../models/metasModel');

module.exports = {
  create: (data, callback) => {
    metaModel.create(data, callback);
  },

  findAll: (callback) => {
    metaModel.findAll(callback);
  },

  findByUserId: (userId, callback) => {
    metaModel.findByUserId(userId, callback);
  },

  findById: (id, callback) => {
    metaModel.findById(id, callback);
  },

  findByIdAndUser: (id, userId, callback) => {
    metaModel.findByIdAndUser(id, userId, callback);
  },

  update: (id, data, callback) => {
    metaModel.update(id, data, callback);
  },

  updateByIdAndUser: (id, userId, data, callback) => {
    metaModel.updateByIdAndUser(id, userId, data, callback);
  },

  delete: (id, callback) => {
    metaModel.remove(id, callback);
  },

  removeByIdAndUser: (id, userId, callback) => {
    metaModel.removeByIdAndUser(id, userId, callback);
  },
};
