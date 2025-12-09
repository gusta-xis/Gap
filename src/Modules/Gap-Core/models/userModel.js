const db = require('../../../config/db');

module.exports = {
  create(data, callback) {
    db.query('INSERT INTO users SET ?', data, callback);
  },
  createMany(lista, callback) {
    // Versão compatível com mysql e mysql2
    const placeholders = lista.map(() => '(?, ?, ?)').join(', ');
    const query = `INSERT INTO users (nome, email, senha) VALUES ${placeholders}`;
    const values = [];
    lista.forEach((u) => values.push(u.nome, u.email, u.senha));
    db.query(query, values, callback);
  },
  findAll(callback) {
    db.query('SELECT * FROM users', callback);
  },
  findById(id, callback) {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, rows) =>
      callback(err, rows[0])
    );
  },
  findByEmail(email, callback) {
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) =>
      callback(err, rows[0])
    );
  },
  update(id, data, callback) {
    db.query('UPDATE users SET ? WHERE id = ?', [data, id], callback);
  },
  remove(id, callback) {
    db.query('DELETE FROM users WHERE id = ?', [id], callback);
  },
};
