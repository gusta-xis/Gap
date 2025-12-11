// ========================================================
// SALARIO CONTROLLER - COM VALIDAÇÃO DE IDOR
// ========================================================

const salarioService = require('../services/salarioService');
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  /**
   * Create - Cria novo salário
   */
  create(req, res) {
    // Adiciona user_id automaticamente do token
    const dados = { ...req.body, user_id: req.user.id };

    salarioService.create(dados, (err, result) => {
      if (err) return sendError(res, err);

      if (req.passo) req.passo('💾', `Salvo no Banco (ID: ${result.insertId})`);

      return res.status(201).json({
        message: 'Salário criado com sucesso',
        id: result.insertId
      });
    });
  },

  /**
   * Find All - Busca todos (apenas admin)
   */
  findAll(req, res) {
    salarioService.findAll((err, rows) => {
      if (err) return sendError(res, err);
      return res.status(200).json(rows);
    });
  },

  /**
   * Find By ID - Busca salário específico
   * ⚠️ IDOR PROTECTION: Valida que o salário pertence ao usuário
   */
  findById(req, res) {
    const id = parseInt(req.params.id, 10);

    // Validação de ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    // Usa findByIdAndUser para garantir que o usuário tem acesso
    salarioService.findByIdAndUser(id, req.user.id, (err, row) => {
      if (err) return sendError(res, err);

      if (!row) {
        // Retorna 403 (Forbidden) em vez de 404 para não vazar informações
        return res.status(403).json({
          error: 'Acesso negado ou salário não encontrado'
        });
      }

      return res.status(200).json(row);
    });
  },

  /**
   * Find By User ID - Busca salários do usuário logado
   */
  findByUserId(req, res) {
    const userId = req.user.id;

    salarioService.findByUserId(userId, (err, rows) => {
      if (err) return sendError(res, err);

      // Array vazio é OK (usuário sem salários cadastrados)
      return res.status(200).json(rows || []);
    });
  },

  /**
   * Update - Atualiza salário
   * ⚠️ IDOR PROTECTION: Valida que o salário pertence ao usuário
   */
  update(req, res) {
    const id = parseInt(req.params.id, 10);

    // Validação de ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    // Usa updateByIdAndUser para garantir autorização
    salarioService.updateByIdAndUser(id, req.user.id, req.body, (err, result) => {
      if (err) return sendError(res, err);

      // Se nenhuma linha foi afetada, usuário não tem acesso
      if (result.affectedRows === 0) {
        return res.status(403).json({
          error: 'Acesso negado ou salário não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Salário atualizado com sucesso'
      });
    });
  },

  /**
   * Delete - Deleta salário
   * ⚠️ IDOR PROTECTION: Valida que o salário pertence ao usuário
   */
  delete(req, res) {
    const id = parseInt(req.params.id, 10);

    // Validação de ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID deve ser um número inteiro válido'
      });
    }

    // Usa deleteByIdAndUser para garantir autorização
    salarioService.deleteByIdAndUser(id, req.user.id, (err, result) => {
      if (err) return sendError(res, err);

      // Se nenhuma linha foi afetada, usuário não tem acesso
      if (result.affectedRows === 0) {
        return res.status(403).json({
          error: 'Acesso negado ou salário não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Salário deletado com sucesso'
      });
    });
  },
};
