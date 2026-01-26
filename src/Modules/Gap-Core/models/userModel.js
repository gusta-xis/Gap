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
    db.query('SELECT id, nome, email, role, credential FROM users', callback);
  },

  findById(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    db.query(
      'SELECT id, nome, email, role, credential FROM users WHERE id = ?',
      [id],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  findByEmail(email, callback) {
    db.query(
      'SELECT id, nome, email, senha, role, credential FROM users WHERE email = ?',
      [email],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  findByEmailOrCredential(login, callback) {
    if (!login || typeof login !== 'string') {
      return callback(new Error('Login inválido'));
    }

    // Se tem @ é email, senão assume credencial
    const field = login.includes('@') ? 'email' : 'credential';

    db.query(
      `SELECT id, nome, email, senha, role, credential, reset_code FROM users WHERE ${field} = ?`,
      [login],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  createAdmin(data, callback) {
    // data: { nome, senha, role (admin/super_admin), creator_role }
    // Gera credencial sequencial baseada no role
    // Gerente Geral e Gerente usam GAPxxxx. Admin usa GAxxxxP.
    const isManagerial = ['super_admin', 'manager'].includes(data.role);
    const prefix = isManagerial ? 'GAP' : 'GA';
    const suffix = isManagerial ? '' : 'P';
    const searchPattern = `${prefix}%${suffix}`;

    // Busca a última credencial usada para incrementar
    db.query('SELECT credential FROM users WHERE credential LIKE ? ORDER BY credential DESC LIMIT 1', [searchPattern], (err, rows) => {
      if (err) return callback(err);

      let nextNum = 1;
      if (rows.length > 0) {
        // Extrai números: GAP0001 -> 0001
        const lastCred = rows[0].credential;
        const numPart = lastCred.replace(/\D/g, '');
        nextNum = parseInt(numPart) + 1;
      }

      const formattedNum = String(nextNum).padStart(4, '0');
      const newCredential = `${prefix}${formattedNum}${suffix}`;

      // Insere
      db.query(
        'INSERT INTO users (nome, email, senha, role, credential) VALUES (?, ?, ?, ?, ?)',
        [data.nome, data.email || null, data.senha, data.role, newCredential],
        (err, result) => {
          if (err) return callback(err);
          callback(null, { ...result, credential: newCredential });
        }
      );
    });
  },

  update(id, data, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID deve ser um número inteiro válido'));
    }

    // Permite atualizar role também
    const ALLOWED_UPDATE_FIELDS_EXTENDED = ['nome', 'email', 'senha', 'role'];
    const filteredData = filterAllowedFields(data, ALLOWED_UPDATE_FIELDS_EXTENDED);

    // hack para permitir 'role' já que filterAllowedFields usa const externa
    if (data.role) filteredData.role = data.role;

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

  saveResetCode(email, code, expires, callback) {
    db.query(
      'UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE email = ?',
      [code, expires, email],
      callback
    );
  },

  validateResetCode(email, code, callback) {
    db.query(
      'SELECT id, email, reset_code, reset_code_expires FROM users WHERE email = ? AND reset_code = ?',
      [email, code],
      (err, rows) => {
        if (err) return callback(err);
        if (!rows || rows.length === 0) return callback(null, null);

        const user = rows[0];
        const now = new Date();
        const expires = new Date(user.reset_code_expires);

        if (now > expires) {
          return callback(null, null); // Expirado
        }

        callback(null, user);
      }
    );
  },

  clearResetCode(email, callback) {
    db.query(
      'UPDATE users SET reset_code = NULL, reset_code_expires = NULL WHERE email = ?',
      [email],
      callback
    );
  },
};
