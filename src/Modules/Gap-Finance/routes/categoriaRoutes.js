const express = require('express');
const router = express.Router();
const db = require('../../../config/db'); // ajuste para o seu arquivo de conexão

// CREATE - Adiciona nova categoria
router.post('/', (req, res) => {
  let { nome, slug, icon } = req.body;
  if (!slug) {
    slug = nome
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-]/g, '')
      .toLowerCase();
  }
  db.query(
    'INSERT INTO categorias (nome, slug, icon) VALUES (?, ?, ?)',
    [nome, slug, icon],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, nome, slug, icon });
    }
  );
});

// READ ALL - Lista todas as categorias
router.get('/', (req, res) => {
  db.query('SELECT * FROM categorias', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// READ ONE - Busca categoria por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM categorias WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(rows[0]);
  });
});

// UPDATE - Atualiza categoria por ID
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nome, slug, icon } = req.body;
  db.query(
    'UPDATE categorias SET nome = ?, slug = ?, icon = ? WHERE id = ?',
    [nome, slug, icon, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
      res.json({ id, nome, slug, icon });
    }
  );
});

// DELETE - Remove categoria por ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query(
    'DELETE FROM categorias WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
      res.json({ success: true });
    }
  );
});

module.exports = router;