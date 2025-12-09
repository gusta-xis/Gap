// 1. Validação de USUÁRIO
module.exports = {
  validateUser: (req, res, next) => {
    const { nome, email, senha } = req.body;

    // Se for a rota de LOGIN, a gente ignora a validação de nome
    if (req.path === '/login') return next();

    if (!nome || !email || !senha) {
      if (req.passo)
        req.passo('⚠️', 'Validação User falhou: Dados incompletos');
      return res
        .status(400)
        .json({ error: 'Campos nome, email e senha são obrigatórios.' });
    }

    if (req.passo) req.passo('📝', 'Validação User: OK');
    next();
  },
};
