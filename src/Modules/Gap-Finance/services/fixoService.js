// ========================================================
// FIXO SERVICE - COM SUPORTE A VALIDAÇÃO DE IDOR
// ========================================================

const fixoModel = require('../models/fixoModel');

module.exports = {
  /**
   * Cria novo gasto fixo
   */
  create: (data, callback) => {
    fixoModel.create(data, callback);
  },

  /**
   * Busca todos os gastos fixos
   */
  findAll: (callback) => {
    fixoModel.findAll(callback);
  },

  /**
   * Busca gastos fixos por usuário
   */
  findByUserId: (userId, callback) => {
    fixoModel.findByUserId(userId, callback);
  },

  /**
   * Busca gasto fixo por ID (sem validação de proprietário)
   */
  findById: (id, callback) => {
    fixoModel.findById(id, callback);
  },

  /**
   * Busca gasto fixo por ID e usuário (com validação de proprietário)
   */
  findByIdAndUser: (id, userId, callback) => {
    fixoModel.findByIdAndUser(id, userId, callback);
  },

  /**
   * Atualiza gasto fixo
   */
  update: (id, data, callback) => {
    fixoModel.update(id, data, callback);
  },

  /**
   * Atualiza gasto fixo com validação de proprietário
   */
  updateByIdAndUser: (id, userId, data, callback) => {
    fixoModel.updateByIdAndUser(id, userId, data, callback);
  },

  /**
   * Deleta gasto fixo
   */
  delete: (id, callback) => {
    fixoModel.remove(id, callback);
  },

  /**
   * Deleta gasto fixo com validação de proprietário
   */
  deleteByIdAndUser: (id, userId, callback) => {
    fixoModel.removeByIdAndUser(id, userId, callback);
  },
};
