function validatePasswordStrength(senha) {
  const errors = [];

  if (senha.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres.');
  }

  if (senha.length > 128) {
    errors.push('Senha muito longa.');
  }

  if (!/[A-Z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra MAIÚSCULA.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*...).');
  }

  return errors;
}

module.exports = {
  validateUser: (req, res, next) => {
    const { nome, email, senha } = req.body;
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

    if (!nome || !email || !senha) {
      if (req.passo) req.passo('⚠️', 'Validação User falhou: Dados incompletos');
      return res
        .status(400)
        .json({ error: 'Campos nome, email e senha são obrigatórios.' });
    }
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
    if (typeof senha !== 'string') {
      return res.status(400).json({ error: 'Senha deve ser um texto válido.' });
    }

    const passwordErrors = validatePasswordStrength(senha);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        error: passwordErrors[0] 
      });
    }

    if (req.passo) req.passo('📝', 'Validação User: OK');
    next();
  },
  validateResetPassword: (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token obrigatório.' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Nova senha obrigatória.' });
    }

    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        error: passwordErrors[0] 
      });
    }

    next();
  },
};
