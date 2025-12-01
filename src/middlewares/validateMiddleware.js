module.exports = (req, res, next) => {
    const { nome, email, senha } = req.body;

    // 1. Verificação de Campos Obrigatórios
    // Se faltar qualquer um desses, barra aqui mesmo.
    if (!nome || !email || !senha) {
        return res.status(400).json({ 
            sucesso: false, 
            erro: "Campos obrigatórios faltando: nome, email e senha são necessários." 
        });
    }

    // 2. Verificação de Formato (Exemplos simples)
    
    // O email tem arroba? (Validação básica)
    if (!email.includes('@')) {
        return res.status(400).json({ 
            sucesso: false, 
            erro: "Formato de email inválido." 
        });
    }

    // A senha é muito curta?
    if (senha.length < 3) {
        return res.status(400).json({ 
            sucesso: false, 
            erro: "A senha precisa ter pelo menos 3 caracteres." 
        });
    }
    req.passo('📝', 'Validação de dados: OK');
    // 3. Se passou por tudo, libera para o Controller
    next();
};
