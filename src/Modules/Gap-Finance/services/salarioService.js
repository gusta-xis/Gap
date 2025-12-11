// ========================================================
// SALARIO SERVICE - COM SUPORTE A VALIDAÇÃO DE IDOR
// ========================================================

const salarioModel = require('../models/salarioModel');

module.exports = {
  /**
   * Cria novo salário
   */
  create: (data, callback) => {
    salarioModel.create(data, callback);
  },

  /**
   * Busca todos os salários
   */
  findAll: (callback) => {
    salarioModel.findAll(callback);
  },

  /**
   * Busca salários por usuário
   */
  findByUserId: (userId, callback) => {
    salarioModel.findByUserId(userId, callback);
  },

  /**
   * Busca salário por ID (sem validação de proprietário)
   */
  findById: (id, callback) => {
    salarioModel.findById(id, callback);
  },

  /**
   * Busca salário por ID e usuário (com validação de proprietário)
   */
  findByIdAndUser: (id, userId, callback) => {
    salarioModel.findByIdAndUser(id, userId, callback);
  },

  /**
   * Atualiza salário
   */
  update: (id, data, callback) => {
    salarioModel.update(id, data, callback);
  },

  /**
   * Atualiza salário com validação de proprietário
   */
  updateByIdAndUser: (id, userId, data, callback) => {
    salarioModel.updateByIdAndUser(id, userId, data, callback);
  },

  /**
   * Deleta salário
   */
  delete: (id, callback) => {
    salarioModel.remove(id, callback);
  },

  /**
   * Deleta salário com validação de proprietário
   */
  deleteByIdAndUser: (id, userId, callback) => {
    salarioModel.removeByIdAndUser(id, userId, callback);
  },
};
