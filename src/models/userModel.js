const db = require('../config/db');

module.exports = {
  
  create(data, callback) {
    const query = "INSERT INTO users SET ?";
    db.query(query, data, callback);
  },

createMany(lista, callback) {
    // 1. Verificação de segurança: Se a lista estiver vazia, retorna erro
    if (!lista || lista.length === 0) {
      return callback(new Error("A lista de usuários está vazia."));
    }

    // 2. Montagem Manual da Query (Funciona em mysql e mysql2)
    // Para cada usuário, criamos um grupo de placeholders "(?, ?, ?)"
    const placeholders = lista.map(() => "(?, ?, ?)").join(", ");
    
    // A query final fica algo como: INSERT INTO users ... VALUES (?, ?, ?), (?, ?, ?)
    const query = `INSERT INTO users (nome, email, senha) VALUES ${placeholders}`;
    
    // 3. Achatamos a lista de valores em um único arrayzão simples
    // De: [ {nome: 'A', ...}, {nome: 'B', ...} ]
    // Para: [ 'A', 'emailA', '123', 'B', 'emailB', '123' ]
    const values = [];
    lista.forEach(u => {
      values.push(u.nome, u.email, u.senha);
    });

    console.log("Query Gerada:", query); // Para você ver no terminal
    console.log("Valores:", values);     // Para você conferir os dados

    db.query(query, values, callback);
  },

  findAll(callback) {
    db.query("SELECT * FROM users", callback);
  },

  findById(id, callback) {
    db.query("SELECT * FROM users WHERE id = ?", [id], (err, rows) => {
      if (err) return callback(err);
      // Retorna null se não achar nada, ou o objeto se achar
      callback(null, rows[0] || null); 
    });
  },

  findByEmail(email, callback) {
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    });
  },

  update(id, data, callback) {
    db.query("UPDATE users SET ? WHERE id = ?", [data, id], callback);
  },

  remove(id, callback) {
    db.query("DELETE FROM users WHERE id = ?", [id], callback);
  }
};