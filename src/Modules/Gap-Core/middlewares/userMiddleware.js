// ========================================================
// VALIDAÇÃO DE USUÁRIO COM REGEX E FORÇA DE SENHA
// ========================================================
module.exports = {
  validateUser: (req, res, next) => {
    const { nome, email, senha } = req.body;

    // Se for a rota de LOGIN, valida apenas email e senha
    if (req.path === '/login') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email || !emailRegex.test(email)) {
        if (req.passo) req.passo('⚠️', 'Validação falhou: Email inválido');
        return res.status(400).json({ error: 'Email inválido.' });
      }

      if (!senha || typeof senha !== 'string') {
        if (req.passo) req.passo('⚠️', 'Validação falhou: Senha inválida');
        return res.status(400).json({ error: 'Senha inválida.' });
      }

      if (req.passo) req.passo('📝', 'Validação Login: OK');
      return next();
    }

    // Para CADASTRO - validação completa
    if (!nome || !email || !senha) {
      if (req.passo) req.passo('⚠️', 'Validação User falhou: Dados incompletos');
      return res
        .status(400)
        .json({ error: 'Campos nome, email e senha são obrigatórios.' });
    }

    // ========== VALIDAR NOME ==========
    if (typeof nome !== 'string') {
      return res.status(400).json({ error: 'Nome deve ser um texto válido.' });
    }

    const nameClean = nome.trim();
    if (nameClean.length < 3) {
      return res.status(400).json({ error: 'Nome deve ter no mínimo 3 caracteres.' });
    }

    if (nameClean.length > 100) {
      return res.status(400).json({ error: 'Nome deve ter no máximo 100 caracteres.' });
    }

    // ========== VALIDAR EMAIL ==========
    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'Email deve ser um texto válido.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Email inválido.' });
    }

    if (email.length > 255) {
      return res.status(400).json({ error: 'Email muito longo.' });
    }

    // ========== VALIDAR SENHA - FORÇA OBRIGATÓRIA ==========
    if (typeof senha !== 'string') {
      return res.status(400).json({ error: 'Senha deve ser um texto válido.' });
    }

    if (senha.length < 8) {
      return res.status(400).json({ 
        error: 'Senha deve ter no mínimo 8 caracteres.' 
      });
    }

    if (senha.length > 128) {
      return res.status(400).json({ 
        error: 'Senha muito longa.' 
      });
    }

    if (!/[A-Z]/.test(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos uma letra MAIÚSCULA.' 
      });
    }

    if (!/[a-z]/.test(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos uma letra minúscula.' 
      });
    }

    if (!/[0-9]/.test(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos um número.' 
      });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos um caractere especial (!@#$%^&*...).' 
      });
    }

    if (req.passo) req.passo('📝', 'Validação User: OK');
    next();
  },
};
