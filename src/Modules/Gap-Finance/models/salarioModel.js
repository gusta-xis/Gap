// ========================================================
// SALARIO MODEL - COM PREVENÇÃO DE IDOR
// ========================================================

const db = require('../../../config/db');

// Campos permitidos para INSERT/UPDATE (whitelist)
const ALLOWED_FIELDS = ['valor', 'mes_ano', 'user_id'];

/**
 * Filtra objeto para incluir apenas campos permitidos
 */
function filterAllowedFields(data) {
  const filtered = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (field in data) {
      filtered[field] = data[field];
    }
  });
  return filtered;
}

module.exports = {
  /**
   * Cria novo salário
   */
  create(data, callback) {
    const filteredData = filterAllowedFields(data);

    if (!filteredData.valor || !filteredData.user_id) {
      return callback(new Error('Valor e user_id são obrigatórios'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = fields.map(() => '?').join(', ');

    const query = `INSERT INTO salarios (${fields.join(', ')}) VALUES (${placeholders})`;

    db.query(query, values, callback);
  },

  /**
   * Busca todos os salários (sem filtro - apenas admin)
   */
  findAll(callback) {
    db.query('SELECT * FROM salarios', callback);
  },

  /**
   * Busca salários por usuário
   */
  findByUserId(userId, callback) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return callback(new Error('User ID deve ser um número inteiro válido'));
    }

    db.query('SELECT * FROM salarios WHERE user_id = ?', [userId], callback);
  },

  /**
   * Busca salário por ID (sem validação de proprietário)
   */
  findById(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query(
      'SELECT * FROM salarios WHERE id = ?',
      [id],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  /**
   * Busca salário por ID E user_id (PREVINE IDOR)
   * Usa esta função em controllers para garantir autorização
   */
  findByIdAndUser(id, userId, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return callback(new Error('User ID deve ser um número inteiro válido'));
    }

    db.query(
      'SELECT * FROM salarios WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  /**
   * Atualiza salário
   */
  update(id, data, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    const filteredData = filterAllowedFields(data);

    if (Object.keys(filteredData).length === 0) {
      return callback(new Error('Nenhum campo válido para atualizar'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    values.push(id); // ID é o último parâmetro

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const query = `UPDATE salarios SET ${setClause} WHERE id = ?`;

    db.query(query, values, callback);
  },

  /**
   * Atualiza salário com validação de proprietário
   */
  updateByIdAndUser(id, userId, data, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return callback(new Error('User ID deve ser um número inteiro válido'));
    }

    const filteredData = filterAllowedFields(data);

    if (Object.keys(filteredData).length === 0) {
      return callback(new Error('Nenhum campo válido para atualizar'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    values.push(id);
    values.push(userId); // Validação dupla: id AND user_id

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const query = `UPDATE salarios SET ${setClause} WHERE id = ? AND user_id = ?`;

    db.query(query, values, callback);
  },

  /**
   * Remove salário
   */
  remove(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query('DELETE FROM salarios WHERE id = ?', [id], callback);
  },

  /**
   * Remove salário com validação de proprietário
   */
  removeByIdAndUser(id, userId, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return callback(new Error('User ID deve ser um número inteiro válido'));
    }

    db.query(
      'DELETE FROM salarios WHERE id = ? AND user_id = ?',
      [id, userId],
      callback
    );
  },
};
