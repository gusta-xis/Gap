const db = require('../../../config/db');

const ALLOWED_CREATE_FIELDS = ['nome', 'email', 'senha'];
const ALLOWED_UPDATE_FIELDS = ['nome', 'email', 'senha']; // Note: 'role' is handled separately where allowed

/**
 * Filters an object to keep only allowed fields.
 * @param {Object} data - The input data object.
 * @param {string[]} allowedFields - List of allowed field names.
 * @returns {Object} - The filtered object.
 */
function filterAllowedFields(data, allowedFields) {
  const filtered = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      filtered[field] = data[field];
    }
  });
  return filtered;
}

module.exports = {
  /**
   * Creates a new standard user.
   * @param {Object} data - User data (nome, email, senha).
   * @param {Function} callback - Callback function (err, result).
   */
  create(data, callback) {
    const filteredData = filterAllowedFields(data, ALLOWED_CREATE_FIELDS);

    if (!filteredData.nome || !filteredData.email || !filteredData.senha) {
      return callback(new Error('Name, email, and password are required'));
    }

    db.query('INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
      [filteredData.nome, filteredData.email, filteredData.senha],
      callback
    );
  },

  /**
   * Creates multiple users at once.
   * @param {Array} lista - List of user objects.
   * @param {Function} callback - Callback function (err, result).
   */
  createMany(lista, callback) {
    if (!Array.isArray(lista) || lista.length === 0) {
      return callback(new Error('User list is empty or invalid'));
    }

    const filteredUsers = lista.map((u) =>
      filterAllowedFields(u, ALLOWED_CREATE_FIELDS)
    );

    for (let i = 0; i < filteredUsers.length; i++) {
      if (!filteredUsers[i].nome || !filteredUsers[i].email || !filteredUsers[i].senha) {
        return callback(new Error(`User at index ${i} is missing required fields`));
      }
    }

    const placeholders = filteredUsers.map(() => '(?, ?, ?)').join(', ');
    const query = `INSERT INTO users (nome, email, senha) VALUES ${placeholders}`;
    const values = [];

    filteredUsers.forEach((u) => values.push(u.nome, u.email, u.senha));

    db.query(query, values, callback);
  },

  /**
   * Retrieves all users (basic info).
   * @param {Function} callback - Callback function (err, rows).
   */
  findAll(callback) {
    db.query('SELECT id, nome, email, role, credential FROM users', callback);
  },

  /**
   * Finds a user by ID.
   * @param {number} id - User ID.
   * @param {Function} callback - Callback function (err, user).
   */
  findById(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID must be a valid integer'));
    }

    db.query(
      'SELECT id, nome, email, role, credential FROM users WHERE id = ?',
      [id],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  /**
   * Finds a user by Email.
   * @param {string} email - User email.
   * @param {Function} callback - Callback function (err, user).
   */
  findByEmail(email, callback) {
    db.query(
      'SELECT id, nome, email, senha, role, credential FROM users WHERE email = ?',
      [email],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  /**
   * Finds a user by Email or Credential.
   * @param {string} login - Email or Credential (GAPxxxx).
   * @param {Function} callback - Callback function (err, user).
   */
  findByEmailOrCredential(login, callback) {
    if (!login || typeof login !== 'string') {
      return callback(new Error('Invalid login'));
    }

    // Determine if login is email (has @) or credential
    const field = login.includes('@') ? 'email' : 'credential';

    db.query(
      `SELECT id, nome, email, senha, role, credential, reset_code FROM users WHERE ${field} = ?`,
      [login],
      (err, rows) => callback(err, rows ? rows[0] : null)
    );
  },

  /**
   * Creates an administrative user (Super Admin, Manager, Admin) with automatic credential generation.
   * @param {Object} data - User data.
   * @param {Function} callback - Callback function.
   */
  createAdmin(data, callback) {
    // data: { nome, senha, role (admin/super_admin/manager), email }
    // Generates sequential credential based on role.
    // General Manager and Manager use GAPxxxx. Admin uses GAxxxxP.
    const isManagerial = ['super_admin', 'manager'].includes(data.role);
    const prefix = isManagerial ? 'GAP' : 'GA';
    const suffix = isManagerial ? '' : 'P';
    const searchPattern = `${prefix}%${suffix}`;

    // Find the last used credential to increment
    db.query('SELECT credential FROM users WHERE credential LIKE ? ORDER BY credential DESC LIMIT 1', [searchPattern], (err, rows) => {
      if (err) return callback(err);

      let nextNum = 1;
      if (rows.length > 0) {
        // Extract numbers: GAP0001 -> 0001
        const lastCred = rows[0].credential;
        const numPart = lastCred.replace(/\D/g, '');
        nextNum = parseInt(numPart, 10) + 1;
      }

      const formattedNum = String(nextNum).padStart(4, '0');
      const newCredential = `${prefix}${formattedNum}${suffix}`;

      // Insert new admin user
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

  /**
   * Updates user data.
   * @param {number} id - User ID.
   * @param {Object} data - Fields to update.
   * @param {Function} callback - Callback function.
   */
  update(id, data, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID must be a valid integer'));
    }

    // Allow updating 'role' explicitly here
    const ALLOWED_UPDATE_FIELDS_EXTENDED = ['nome', 'email', 'senha', 'role'];
    const filteredData = filterAllowedFields(data, ALLOWED_UPDATE_FIELDS_EXTENDED);

    // Explicitly check for role if passed, as filterAllowedFields might filter it based on standard list usage
    if (Object.prototype.hasOwnProperty.call(data, 'role')) {
      filteredData.role = data.role;
    }

    if (Object.keys(filteredData).length === 0) {
      return callback(new Error('No valid fields to update'));
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    values.push(id);

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;

    db.query(query, values, callback);
  },

  /**
   * Deletes a user.
   * @param {number} id - User ID.
   * @param {Function} callback - Callback function.
   */
  remove(id, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID must be a valid integer'));
    }

    db.query('DELETE FROM users WHERE id = ?', [id], callback);
  },

  /**
   * Updates a user's password.
   * @param {number} id - User ID.
   * @param {string} hashedPassword - The salted and hashed password.
   * @param {Function} callback - Callback function.
   */
  updatePassword(id, hashedPassword, callback) {
    if (!Number.isInteger(id) || id <= 0) {
      return callback(new Error('ID must be a valid integer'));
    }

    if (!hashedPassword) {
      return callback(new Error('Hashed password is required'));
    }

    db.query('UPDATE users SET senha = ? WHERE id = ?', [hashedPassword, id], callback);
  },

  /**
   * Saves a password reset code.
   * @param {string} email - User email.
   * @param {string} code - Reset code.
   * @param {Date} expires - Expiration date.
   * @param {Function} callback - Callback function.
   */
  saveResetCode(email, code, expires, callback) {
    db.query(
      'UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE email = ?',
      [code, expires, email],
      callback
    );
  },

  /**
   * Validates a reset code.
   * @param {string} email - User email.
   * @param {string} code - Reset code.
   * @param {Function} callback - Callback function.
   */
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
          return callback(null, null); // Expired
        }

        callback(null, user);
      }
    );
  },

  /**
   * Clears the reset code after usage.
   * @param {string} email - User email.
   * @param {Function} callback - Callback function.
   */
  clearResetCode(email, callback) {
    db.query(
      'UPDATE users SET reset_code = NULL, reset_code_expires = NULL WHERE email = ?',
      [email],
      callback
    );
  },
};
