const variaveisService = require('../services/variaveisService');
const metasModel = require('../models/metasModel');
const { sendError } = require('../../../utils/errorHandler');

// Helper: Promisify Service Calls (Internal)
const Service = {
  create: (data) => new Promise((resolve, reject) => variaveisService.create(data, (err, res) => err ? reject(err) : resolve(res))),
  findByIdAndUser: (id, uid) => new Promise((resolve, reject) => variaveisService.findByIdAndUser(id, uid, (err, res) => err ? reject(err) : resolve(res))),
  updateByIdAndUser: (id, uid, data) => new Promise((resolve, reject) => variaveisService.updateByIdAndUser(id, uid, data, (err, res) => err ? reject(err) : resolve(res))),
  deleteByIdAndUser: (id, uid) => new Promise((resolve, reject) => variaveisService.deleteByIdAndUser(id, uid, (err, res) => err ? reject(err) : resolve(res))),
  findMeta: (id, uid) => new Promise((resolve, reject) => metasModel.findByIdAndUser(id, uid, (err, res) => err ? reject(err) : resolve(res))),
  updateMeta: (id, uid, data) => new Promise((resolve, reject) => metasModel.updateByIdAndUser(id, uid, data, (err, res) => err ? reject(err) : resolve(res)))
};

// Helper: Update Meta Balance Logic
// Delta is positive to add (create), negative to remove (delete)
async function syncMetaBalance(metaId, userId, deltaValue) {
  if (!metaId || metaId <= 0 || !deltaValue) return;
  try {
    const meta = await Service.findMeta(metaId, userId);
    if (!meta) return;

    const currentMetaValue = parseFloat(meta.valor_atual) || 0;
    const newMetaValue = currentMetaValue + parseFloat(deltaValue);

    await Service.updateMeta(metaId, userId, { valor_atual: newMetaValue });
  } catch (err) {
    console.error(`❌ Erro ao sincronizar meta ${metaId}:`, err.message);
    // Non-blocking error for main flow, but logged
  }
}

module.exports = {
  async create(req, res) {
    if (req.passo) req.passo('⚙️', 'Criando Gasto Variável');

    try {
      const dados = { ...req.body, user_id: req.user.id };
      if (!dados.categoria_id) dados.categoria_id = null;

      // 1. Save Expense
      const result = await Service.create(dados);

      if (req.passo) req.passo('💾', `Salvo no Banco(ID: ${result.insertId})`);

      // 2. Sync Meta (if linked)
      if (dados.meta_id) {
        await syncMetaBalance(dados.meta_id, req.user.id, dados.valor);
      }

      return res.status(201).json({
        message: 'Gasto variável criado com sucesso',
        id: result.insertId
      });

    } catch (err) {
      console.error('❌ Erro ao criar despesa:', err);
      // Fallback manual error handling to match original format
      return res.status(500).json({
        error: 'Erro ao salvar despesa',
        details: err.message,
        code: err.code,
        sql: err.sql
      });
    }
  },

  findByUserId(req, res) {
    const userId = req.user.id;
    variaveisService.findByUserId(userId, (err, rows) => {
      if (err) return sendError(res, err);
      return res.status(200).json(rows || []);
    });
  },

  findAll(req, res) {
    variaveisService.findAll((err, rows) => {
      if (err) return sendError(res, err);
      return res.status(200).json(rows);
    });
  },

  findById(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID deve ser um número inteiro válido' });

    variaveisService.findByIdAndUser(id, req.user.id, (err, row) => {
      if (err) return sendError(res, err);
      if (!row) return res.status(403).json({ error: 'Acesso negado ou gasto não encontrado' });
      return res.status(200).json(row);
    });
  },

  async update(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID deve ser um número inteiro válido' });

    try {
      // 1. Fetch Current State
      const currentExpense = await Service.findByIdAndUser(id, req.user.id);
      if (!currentExpense) return res.status(404).json({ error: 'Gasto não encontrado' });

      // 2. Calculate Diffs
      const oldMetaId = currentExpense.meta_id;
      const oldVal = parseFloat(currentExpense.valor) || 0;

      const newMetaId = req.body.meta_id !== undefined ? req.body.meta_id : oldMetaId;
      const newVal = req.body.valor !== undefined ? parseFloat(req.body.valor) : oldVal;

      // 3. Process Meta Changes
      // A. Remove old value from old meta
      if (oldMetaId) {
        // If meta changed OR value changed, we remove the OLD contribution first
        // Optimization: If meta is same, we can just do delta, but removing/adding is safer logic
        if (oldMetaId !== newMetaId) {
          await syncMetaBalance(oldMetaId, req.user.id, -oldVal);
        } else {
          // Same meta, just calc delta
          const delta = newVal - oldVal;
          if (delta !== 0) await syncMetaBalance(oldMetaId, req.user.id, delta);
        }
      }

      // B. Add new value to new meta (if meta changed)
      if (newMetaId && newMetaId !== oldMetaId) {
        await syncMetaBalance(newMetaId, req.user.id, newVal);
      }

      // 4. Update Expense
      await Service.updateByIdAndUser(id, req.user.id, req.body);

      return res.status(200).json({ message: 'Gasto variável atualizado com sucesso' });

    } catch (err) {
      return sendError(res, err);
    }
  },

  async delete(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID deve ser um número inteiro válido' });

    try {
      // 1. Fetch before delete (to handle meta)
      const expense = await Service.findByIdAndUser(id, req.user.id);

      // If not found, proceed to delete anyway to ensure idempotency/consistent return
      if (expense && expense.meta_id) {
        const valorADeduzir = parseFloat(expense.valor) || 0;
        await syncMetaBalance(expense.meta_id, req.user.id, -valorADeduzir);
      }

      // 2. Delete
      const result = await Service.deleteByIdAndUser(id, req.user.id);

      if (result.affectedRows === 0) {
        // Double check if it was truly not found or just access denied (already checked by findByIdAndUser implicitly)
        return res.status(403).json({ error: 'Acesso negado ou gasto não encontrado' });
      }

      return res.status(200).json({ message: 'Gasto variável deletado com sucesso' });

    } catch (err) {
      return sendError(res, err);
    }
  },
};
