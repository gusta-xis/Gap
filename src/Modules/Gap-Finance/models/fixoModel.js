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
      `SELECT gf.*, c.nome as categoria 
       FROM gastos_fixos gf
       LEFT JOIN categorias c ON gf.categoria_id = c.id
       WHERE gf.user_id = ?
       ORDER BY gf.dia_vencimento ASC`,
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
