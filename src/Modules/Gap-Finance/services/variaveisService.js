// ========================================================
// VARIAVEIS SERVICE - COM SUPORTE A VALIDAÇÃO DE IDOR
// ========================================================

const variaveisModel = require('../models/variaveisModel');

module.exports = {
  /**
   * Cria novo gasto variável
   */
  create: (data, callback) => {
    variaveisModel.create(data, callback);
  },

  /**
   * Busca todos os gastos variáveis
   */
  findAll: (callback) => {
    variaveisModel.findAll(callback);
  },

  /**
   * Busca gastos variáveis por usuário
   */
  findByUserId: (userId, callback) => {
    variaveisModel.findByUserId(userId, callback);
  },

  /**
   * Busca gasto variável por ID (sem validação de proprietário)
   */
  findById: (id, callback) => {
    variaveisModel.findById(id, callback);
  },

  /**
   * Busca gasto variável por ID e usuário (com validação de proprietário)
   */
  findByIdAndUser: (id, userId, callback) => {
    variaveisModel.findByIdAndUser(id, userId, callback);
  },

  /**
   * Atualiza gasto variável
   */
  update: (id, data, callback) => {
    variaveisModel.update(id, data, callback);
  },

  /**
   * Atualiza gasto variável com validação de proprietário
   */
  updateByIdAndUser: (id, userId, data, callback) => {
    variaveisModel.updateByIdAndUser(id, userId, data, callback);
  },

  /**
   * Deleta gasto variável
   */
  delete: (id, callback) => {
    variaveisModel.remove(id, callback);
  },

  /**
   * Deleta gasto variável com validação de proprietário
   */
  deleteByIdAndUser: (id, userId, callback) => {
    variaveisModel.removeByIdAndUser(id, userId, callback);
  },
};
