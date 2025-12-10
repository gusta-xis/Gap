const db = require('../../../config/db');

module.exports = {
  create(data, callback) {
    db.query('INSERT INTO gastos_variaveis SET ?', data, callback);
  },

  findAll(callback) {
    db.query('SELECT * FROM gastos_variaveis', callback);
  },

  findByUserId(userId, callback) {
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

  findById(id, callback) {
    db.query(
      'SELECT * FROM gastos_variaveis WHERE id = ?',
      [id],
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0] || null);
      }
    );
  },

  update(id, data, callback) {
    db.query(
      'UPDATE gastos_variaveis SET ? WHERE id = ?',
      [data, id],
      callback
    );
  },

  remove(id, callback) {
    db.query('DELETE FROM gastos_variaveis WHERE id = ?', [id], callback);
  },
};
