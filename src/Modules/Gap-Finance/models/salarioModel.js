const db = require('../../../config/db');

module.exports = {
  create(data, callback) {
    // O SEGREDO ESTÁ AQUI: Usa db.query, e não salarioModel.create
    db.query('INSERT INTO salarios SET ?', data, callback);
  },

  findAll(callback) {
    db.query('SELECT * FROM salarios', callback);
  },

  findByUserId(userId, callback) {
    db.query('SELECT * FROM salarios WHERE user_id = ?', [userId], callback);
  },

  findById(id, callback) {
    db.query('SELECT * FROM salarios WHERE id = ?', [id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    });
  },

  update(id, data, callback) {
    db.query('UPDATE salarios SET ? WHERE id = ?', [data, id], callback);
  },

  remove(id, callback) {
    db.query('DELETE FROM salarios WHERE id = ?', [id], callback);
  },
};
