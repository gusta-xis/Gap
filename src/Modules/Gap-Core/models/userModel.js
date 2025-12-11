// ========================================================
// USER MODEL - COM WHITELIST DE SEGURANÇA
// Previne Mass Assignment Attack e SQL Injection
// ========================================================

const db = require('../../../config/db');

// Campos permitidos para INSERT/UPDATE (whitelist)
const ALLOWED_CREATE_FIELDS = ['nome', 'email', 'senha'];
const ALLOWED_UPDATE_FIELDS = ['nome', 'email', 'senha'];

/**
 * Filtra objeto para incluir apenas campos permitidos
 * @param {Object} data - Dados a filtrar
 * @param {Array} allowedFields - Lista de campos permitidos
 * @returns {Object} Objeto filtrado
 */
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
  /**
   * Cria novo usuário (com validação de campos)
   */
  create(data, callback) {
    // Filtra apenas campos permitidos
    const filteredData = filterAllowedFields(data, ALLOWED_CREATE_FIELDS);

    // Valida que tem os campos obrigatórios
    if (!filteredData.nome || !filteredData.email || !filteredData.senha) {
      return callback(new Error('Nome, email e senha são obrigatórios'));
    }

    db.query('INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)', 
      [filteredData.nome, filteredData.email, filteredData.senha], 
      callback
    );
  },

  /**
   * Cria múltiplos usuários (batch insert)
   */
  createMany(lista, callback) {
    if (!Array.isArray(lista) || lista.length === 0) {
      return callback(new Error('Lista de usuários vazia ou inválida'));
    }

    // Filtra cada usuário
    const filteredUsers = lista.map((u) =>
      filterAllowedFields(u, ALLOWED_CREATE_FIELDS)
    );

    // Valida que todos tem campos obrigatórios
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

  /**
   * Retorna todos os usuários (sem campos sensíveis)
   */
  findAll(callback) {
    db.query('SELECT id, nome, email FROM users', callback);
  },

  /**
   * Encontra usuário por ID
   */
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

  /**
   * Encontra usuário por email (retorna com senha para login)
   */
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

  /**
   * Atualiza usuário (com validação de campos)
   */
  update(id, data, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    // Filtra apenas campos permitidos
    const filteredData = filterAllowedFields(data, ALLOWED_UPDATE_FIELDS);

    // Se não há campos válidos para atualizar
    if (Object.keys(filteredData).length === 0) {
      return callback(new Error('Nenhum campo válido para atualizar'));
    }

    // Construir query dinamicamente com parametrização
    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    values.push(id); // Último valor é o ID

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;

    db.query(query, values, callback);
  },

  /**
   * Remove usuário por ID
   */
  remove(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query('DELETE FROM users WHERE id = ?', [id], callback);
  },

  /**
   * Atualiza apenas a senha do usuário (para recuperação de senha)
   */
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
