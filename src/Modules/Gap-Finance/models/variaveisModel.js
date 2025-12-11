// ========================================================
// VARIAVEIS MODEL - GASTOS VARIÁVEIS COM PREVENÇÃO DE IDOR
// ========================================================

const db = require('../../../config/db');

// Campos permitidos para INSERT/UPDATE (whitelist)
const ALLOWED_FIELDS = ['nome', 'valor', 'data_gasto', 'categoria_id', 'user_id', 'tipo'];

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
   * Cria novo gasto variável
   */
  create(data, callback) {
    const filteredData = filterAllowedFields(data);

    if (!filteredData.nome || !filteredData.valor || !filteredData.user_id) {
      return callback(new Error('Nome, valor e user_id são obrigatórios'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = fields.map(() => '?').join(', ');

    const query = `INSERT INTO gastos_variaveis (${fields.join(', ')}) VALUES (${placeholders})`;

    db.query(query, values, callback);
  },

  /**
   * Busca todos os gastos (sem filtro - apenas admin)
   */
  findAll(callback) {
    db.query('SELECT * FROM gastos_variaveis', callback);
  },

  /**
   * Busca gastos variáveis por usuário (com categoria)
   */
  findByUserId(userId, callback) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return callback(new Error('User ID deve ser um número inteiro válido'));
    }

    db.query(
      `SELECT gv.*, c.nome as categoria, 
        LOWER(REPLACE(c.nome, 'ç', 'c')) as categoria_slug
       FROM gastos_variaveis gv
       LEFT JOIN categorias c ON gv.categoria_id = c.id
       WHERE gv.user_id = ?
       ORDER BY gv.data_gasto DESC`,
      [userId],
      callback
    );
  },

  /**
   * Busca gasto variável por ID (sem validação de proprietário)
   */
  findById(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query(
      'SELECT * FROM gastos_variaveis WHERE id = ?',
      [id],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  /**
   * Busca gasto variável por ID E user_id (PREVINE IDOR)
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
      `SELECT gv.*, c.nome as categoria, 
        LOWER(REPLACE(c.nome, 'ç', 'c')) as categoria_slug
       FROM gastos_variaveis gv
       LEFT JOIN categorias c ON gv.categoria_id = c.id
       WHERE gv.id = ? AND gv.user_id = ?`,
      [id, userId],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  /**
   * Atualiza gasto variável
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
    const query = `UPDATE gastos_variaveis SET ${setClause} WHERE id = ?`;

    db.query(query, values, callback);
  },

  /**
   * Atualiza gasto variável com validação de proprietário
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
    const query = `UPDATE gastos_variaveis SET ${setClause} WHERE id = ? AND user_id = ?`;

    db.query(query, values, callback);
  },

  /**
   * Remove gasto variável
   */
  remove(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query('DELETE FROM gastos_variaveis WHERE id = ?', [id], callback);
  },

  /**
   * Remove gasto variável com validação de proprietário
   */
  removeByIdAndUser(id, userId, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return callback(new Error('User ID deve ser um número inteiro válido'));
    }

    db.query(
      'DELETE FROM gastos_variaveis WHERE id = ? AND user_id = ?',
      [id, userId],
      callback
    );
  },
};
