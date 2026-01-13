const variaveisService = require('../services/variaveisService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  create(req, res) {
    if (req.passo) req.passo('⚙️', 'Criando Gasto Variável');

    const dados = { ...req.body, user_id: req.user.id };
    if (!dados.categoria_id) dados.categoria_id = null;

    variaveisService.create(dados, (err, result) => {
      if (err) {
        console.error('❌ Erro ao criar despesa:', err);
        return res.status(500).json({
          error: 'Erro ao salvar despesa',
          details: err.message,
          code: err.code,
          sql: err.sql
        });
      }

      if (req.passo) req.passo('💾', `Salvo no Banco(ID: ${result.insertId})`);

      // Se houver meta_id, atualiza o saldo da meta
      // Se houver meta_id, atualiza o saldo da meta
      if (dados.meta_id && dados.meta_id > 0) {
        try {
          const metasModel = require('../models/metasModel'); // Use Model directly to avoid service complexity

          metasModel.findByIdAndUser(dados.meta_id, req.user.id, (errMeta, meta) => {
            if (errMeta) {
              console.error('Erro ao buscar meta para atualização:', errMeta);
              return;
            }
            if (meta) {
              const novoValor = (parseFloat(meta.valor_atual) || 0) + parseFloat(dados.valor);
              metasModel.updateByIdAndUser(dados.meta_id, req.user.id, { valor_atual: novoValor }, (errUp) => {
                if (errUp) console.error('Erro ao atualizar saldo da meta:', errUp);
              });
            }
          });
        } catch (e) {
          console.error('Erro ao processar atualização de meta:', e);
        }
      }

      return res.status(201).json({
        message: 'Gasto variável criado com sucesso',
        id: result.insertId
      });
    });
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

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    variaveisService.findByIdAndUser(id, req.user.id, (err, row) => {
      if (err) return sendError(res, err);

      if (!row) {
        return res.status(403).json({
          error: 'Acesso negado ou gasto não encontrado'
        });
      }

      return res.status(200).json(row);
    });
  },

  update(req, res) {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    const variaveisService = require('../services/variaveisService'); // Ensure service is available
    const metasModel = require('../models/metasModel');

    // 1. Busca estado ATUAL (antes da edição)
    variaveisService.findByIdAndUser(id, req.user.id, (errFind, currentExpense) => {
      if (errFind) return sendError(res, errFind);
      if (!currentExpense) return res.status(404).json({ error: 'Gasto não encontrado' });

      const oldMetaId = currentExpense.meta_id;
      const oldVal = parseFloat(currentExpense.valor) || 0;

      const newMetaId = req.body.meta_id !== undefined ? req.body.meta_id : oldMetaId;
      const newVal = req.body.valor !== undefined ? parseFloat(req.body.valor) : oldVal;

      // Função auxiliar para atualizar meta (promisified-like logic for simplicity in callback hell)
      const updateMetaBalance = (mId, delta, cb) => {
        if (!mId) return cb();
        metasModel.findByIdAndUser(mId, req.user.id, (errM, metaObj) => {
          if (errM || !metaObj) return cb(); // Log erro?
          const updatedVal = (parseFloat(metaObj.valor_atual) || 0) + delta;
          metasModel.updateByIdAndUser(mId, req.user.id, { valor_atual: updatedVal }, () => cb());
        });
      };

      // 2. Lógica de Balanço
      const processBalanceUpdates = (done) => {
        // Caso 1: Meta mudou (A -> B, A -> Null, Null -> B)
        if (oldMetaId != newMetaId) {
          // Remove da antiga (se existia)
          updateMetaBalance(oldMetaId, -oldVal, () => {
            // Adiciona na nova (se existe)
            updateMetaBalance(newMetaId, newVal, done);
          });
        } else {
          // Caso 2: Mesma meta, valor mudou
          const delta = newVal - oldVal;
          if (delta !== 0) {
            updateMetaBalance(oldMetaId, delta, done);
          } else {
            done();
          }
        }
      };

      processBalanceUpdates(() => {
        // 3. Persiste a alteração do Gasto
        variaveisService.updateByIdAndUser(id, req.user.id, req.body, (errUpd, result) => {
          if (errUpd) return sendError(res, errUpd);
          return res.status(200).json({ message: 'Gasto variável atualizado com sucesso' });
        });
      });
    });
  },

  delete(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    const variaveisService = require('../services/variaveisService');
    const metasModel = require('../models/metasModel');

    // 1. Busca a despesa antes de deletar para ajustar a meta
    variaveisService.findByIdAndUser(id, req.user.id, (errFind, expense) => {
      if (errFind) return sendError(res, errFind);

      // Se não achou, deixa o delete normal lidar (ou retorna 404)
      // Mas para consistência, vamos prosseguir para o delete que retornará affectedRows=0 se não existir

      const proceedDelete = () => {
        variaveisService.deleteByIdAndUser(id, req.user.id, (err, result) => {
          if (err) return sendError(res, err);

          if (result.affectedRows === 0) {
            return res.status(403).json({
              error: 'Acesso negado ou gasto não encontrado'
            });
          }

          return res.status(200).json({
            message: 'Gasto variável deletado com sucesso'
          });
        });
      };

      if (expense && expense.meta_id) {
        // Decrementa da meta
        const valorADeduzir = parseFloat(expense.valor) || 0;
        metasModel.findByIdAndUser(expense.meta_id, req.user.id, (errM, metaObj) => {
          if (!errM && metaObj) {
            const novoValor = (parseFloat(metaObj.valor_atual) || 0) - valorADeduzir;
            metasModel.updateByIdAndUser(expense.meta_id, req.user.id, { valor_atual: novoValor }, () => {
              proceedDelete();
            });
          } else {
            proceedDelete();
          }
        });
      } else {
        proceedDelete();
      }
    });
  },
};
