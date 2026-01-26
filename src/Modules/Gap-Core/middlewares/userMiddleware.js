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
    const isUpdate = req.method === 'PUT' || req.method === 'PATCH';

    if (req.path === '/login') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido.' });
      }
      if (!senha || typeof senha !== 'string') {
        return res.status(400).json({ error: 'Senha inválida.' });
      }
      return next();
    }

    // Para CREATE (POST), tudo é obrigatório
    if (!isUpdate) {
      if (!nome || !email || !senha) {
        return res
          .status(400)
          .json({ error: 'Campos nome, email e senha são obrigatórios.' });
      }
    }

    // Validações individuais SE o campo estiver presente

    if (nome !== undefined) {
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
    }

    if (email !== undefined) {
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
    }

    if (senha !== undefined) {
      if (typeof senha !== 'string') {
        return res.status(400).json({ error: 'Senha deve ser um texto válido.' });
      }
      // Validação de força de senha
      const passwordErrors = validatePasswordStrength(senha);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: passwordErrors[0]
        });
      }
    }

    next();
  },
  validateResetPassword: (req, res, next) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios.' });
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
