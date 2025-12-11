module.exports = {
  validateSalario: (req, res, next) => {
    const { valor, referencia_mes } = req.body;

    if (valor === undefined || valor < 0) {
      if (req.passo)
        req.passo('⚠️', 'Validação Salário falhou: Valor inválido');
      return res.status(400).json({ error: 'O valor deve ser positivo.' });
    }

    if (!referencia_mes) {
      if (req.passo) req.passo('⚠️', 'Validação Salário falhou: Sem mês');
      return res
        .status(400)
        .json({ error: 'A referência do mês (AAAA-MM) é obrigatória.' });
    }

    if (req.passo) req.passo('📝', 'Validação Salário: OK');
    next();
  },

  validateCategoria: (req, res, next) => {
    const { nome } = req.body;

    if (!nome) {
      if (req.passo) req.passo('⚠️', 'Validação Categoria: Sem nome');
      return res
        .status(400)
        .json({ error: 'O nome da categoria é obrigatório.' });
    }

    if (req.passo) req.passo('📝', 'Validação Categoria: OK');
    next();
  },

  validateGastoFixo: (req, res, next) => {
    const { nome, valor, categoria_id, dia_vencimento } = req.body;

    if (!nome || !valor || !categoria_id || !dia_vencimento) {
      if (req.passo) req.passo('⚠️', 'Validação Gasto Fixo: Dados incompletos');
      return res.status(400).json({
        error:
          'Campos obrigatórios: nome, valor, categoria_id, dia_vencimento.',
      });
    }

    if (dia_vencimento < 1 || dia_vencimento > 31) {
      return res
        .status(400)
        .json({ error: 'O dia do vencimento deve ser entre 1 e 31.' });
    }

    if (req.passo) req.passo('📝', 'Validação Gasto Fixo: OK');
    next();
  },

  validateGastoVariavel: (req, res, next) => {
    const { nome, valor, data_gasto, data, categoria_id } = req.body;
    
    const dataFinal = data_gasto || data;

    if (!nome || !valor || !dataFinal) {
      if (req.passo)
        req.passo('⚠️', 'Validação Gasto Var falhou: Campos faltando');
      return res.status(400).json({
        error:
          'Campos obrigatórios: nome, valor e data.',
      });
    }

    if (parseFloat(valor) <= 0) {
      if (req.passo)
        req.passo('⚠️', 'Validação Gasto Var falhou: Valor incorreto');
      return res
        .status(400)
        .json({ error: 'O valor do gasto deve ser maior que zero.' });
    }

    const regexData = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexData.test(dataFinal)) {
      if (req.passo)
        req.passo('⚠️', 'Validação Gasto Var falhou: Data inválida');
      return res.status(400).json({
        error: 'Data inválida. Use o formato AAAA-MM-DD (ex: 2025-12-31).',
      });
    }
    
    if (!req.body.data_gasto && req.body.data) {
      req.body.data_gasto = req.body.data;
    }

    if (!categoria_id) {
      req.body.categoria_id = null;
    }

    if (req.passo) req.passo('📝', 'Validação Gasto Variável: OK');
    next();
  },
};
