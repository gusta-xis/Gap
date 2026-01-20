const db = require('../../../config/db');

const ALLOWED_CREATE_FIELDS = ['nome', 'email', 'senha'];
const ALLOWED_UPDATE_FIELDS = ['nome', 'email', 'senha'];

function filterAllowedFields(data, allowedFields) {
  const filtered = {};
  allowedFields.forEach((field) => {
    if (field in data) {
      filtered[field] = data[field];
    }
  });
  return filtered;
}

module.exports = {
  create(data, callback) {
    const filteredData = filterAllowedFields(data, ALLOWED_CREATE_FIELDS);

    if (!filteredData.nome || !filteredData.email || !filteredData.senha) {
      return callback(new Error('Nome, email e senha são obrigatórios'));
    }

    db.query('INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)', 
      [filteredData.nome, filteredData.email, filteredData.senha], 
      callback
    );
  },

  createMany(lista, callback) {
    if (!Array.isArray(lista) || lista.length === 0) {
      return callback(new Error('Lista de usuários vazia ou inválida'));
    }

    const filteredUsers = lista.map((u) =>
      filterAllowedFields(u, ALLOWED_CREATE_FIELDS)
    );

    for (let i = 0; i < filteredUsers.length; i++) {
      if (!filteredUsers[i].nome || !filteredUsers[i].email || !filteredUsers[i].senha) {
        return callback(new Error(`Usuário ${i} falta campos obrigatórios`));
      }
    }

    const placeholders = filteredUsers.map(() => '(?, ?, ?)').join(', ');
    const query = `INSERT INTO users (nome, email, senha) VALUES ${placeholders}`;
    const values = [];

    filteredUsers.forEach((u) => values.push(u.nome, u.email, u.senha));

    db.query(query, values, callback);
  },

  findAll(callback) {
    db.query('SELECT id, nome, email FROM users', callback);
  },

  findById(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query(
      'SELECT id, nome, email FROM users WHERE id = ?',
      [id],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  findByEmail(email, callback) {
    if (!email || typeof email !== 'string') {
      return callback(new Error('Email deve ser uma string válida'));
    }

    db.query(
      'SELECT id, nome, email, senha FROM users WHERE email = ?',
      [email],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  update(id, data, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    const filteredData = filterAllowedFields(data, ALLOWED_UPDATE_FIELDS);

    if (Object.keys(filteredData).length === 0) {
      return callback(new Error('Nenhum campo válido para atualizar'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    values.push(id);

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;

    db.query(query, values, callback);
  },

  remove(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query('DELETE FROM users WHERE id = ?', [id], callback);
  },

  updatePassword(id, hashedPassword, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    if (!hashedPassword) {
      return callback(new Error('Senha hash obrigatória'));
    }

    db.query('UPDATE users SET senha = ? WHERE id = ?', [hashedPassword, id], callback);
  },
};
