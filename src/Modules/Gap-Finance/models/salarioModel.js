const db = require('../../../config/db');

// 1. AJUSTE AQUI: Definimos os campos que a tabela 'salarios' realmente tem
const ALLOWED_FIELDS = [
    'descricao', 
    'valor', 
    'data_recebimento', 
    'referencia_mes', 
    'user_id'
];

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
  create(data, callback) {
    // Se o front mandar 'nome', mapeia para 'descricao' para evitar erro
    if (data.nome && !data.descricao) {
        data.descricao = data.nome;
    }

    const filteredData = filterAllowedFields(data);

    // Validação básica do Backend
    if (!filteredData.descricao || !filteredData.valor || !filteredData.user_id || !filteredData.data_recebimento) {
      return callback(new Error('Descrição, valor, data de recebimento e user_id são obrigatórios'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = fields.map(() => '?').join(', ');

    // Query ajustada para a tabela 'salarios'
    const query = `INSERT INTO salarios (${fields.join(', ')}) VALUES (${placeholders})`;

    db.query(query, values, callback);
  },

  findAll(callback) {
    db.query('SELECT * FROM salarios ORDER BY data_recebimento DESC', callback);
  },

  findByUserId(userId, callback) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return callback(new Error('User ID deve ser um número inteiro válido'));
    }

    // Busca simples na tabela salarios (sem join de categorias, pois salário geralmente não tem)
    db.query(
      `SELECT * FROM salarios 
       WHERE user_id = ? 
       ORDER BY data_recebimento DESC`,
      [userId],
      callback
    );
  },

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

  findByIdAndUser(id, userId, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query(
      'SELECT * FROM salarios WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  update(id, data, callback) {
     // ... lógica de update genérica ...
     // (Mantive simplificado, mas lembre de usar filterAllowedFields também no update se for implementar)
  },

  updateByIdAndUser(id, userId, data, callback) {
    // Mapeamento de compatibilidade
    if (data.nome && !data.descricao) data.descricao = data.nome;

    const filteredData = filterAllowedFields(data);

    if (Object.keys(filteredData).length === 0) {
      return callback(new Error('Nenhum campo válido para atualizar'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    values.push(id);
    values.push(userId);

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const query = `UPDATE salarios SET ${setClause} WHERE id = ? AND user_id = ?`;

    db.query(query, values, callback);
  },

  remove(id, callback) {
    db.query('DELETE FROM salarios WHERE id = ?', [id], callback);
  },

  removeByIdAndUser(id, userId, callback) {
    db.query(
      'DELETE FROM salarios WHERE id = ? AND user_id = ?',
      [id, userId],
      callback
    );
  },
};