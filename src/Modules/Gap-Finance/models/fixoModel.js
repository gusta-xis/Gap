const db = require('../../../config/db');

module.exports = {
  create(data, callback) {
    db.query('INSERT INTO gastos_fixos SET ?', data, callback);
  },

  findAll(callback) {
    db.query('SELECT * FROM gastos_fixos', callback);
  },

  findByUserId(userId, callback) {
    db.query(
      'SELECT * FROM gastos_fixos WHERE user_id = ?',
      [userId],
      callback
    );
  },

  findById(id, callback) {
    db.query('SELECT * FROM gastos_fixos WHERE id = ?', [id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    });
  },

  update(id, data, callback) {
    db.query('UPDATE gastos_fixos SET ? WHERE id = ?', [data, id], callback);
  },

  remove(id, callback) {
    db.query('DELETE FROM gastos_fixos WHERE id = ?', [id], callback);
  },
};
