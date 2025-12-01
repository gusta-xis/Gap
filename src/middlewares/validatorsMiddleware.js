module.exports = {
    // 1. Validação de USUÁRIO
    validateUser: (req, res, next) => {
        const { nome, email, senha } = req.body;
        
        if (!nome || !email || !senha) {
            if (req.passo) req.passo('⚠️', 'Validação User falhou: Dados incompletos');
            return res.status(400).json({ error: "Campos nome, email e senha são obrigatórios." });
        }
        
        if (req.passo) req.passo('📝', 'Validação User: OK');
        next();
    },

    // 2. Validação de SALÁRIO
    validateSalario: (req, res, next) => {
        const { valor, referencia_mes } = req.body;

        // DICA DE OURO: Não exigimos user_id aqui.
        // Motivo: O user_id a gente pega automático do Token (req.user.id) no Controller.
        // Isso é mais seguro!

        // Verifica valor
        if (valor === undefined || valor < 0) {
            if (req.passo) req.passo('⚠️', 'Validação Salário falhou: Valor inválido');
            return res.status(400).json({ error: "O valor deve ser positivo." });
        }

        // Verifica data
        if (!referencia_mes) {
            if (req.passo) req.passo('⚠️', 'Validação Salário falhou: Sem mês');
            return res.status(400).json({ error: "A referência do mês (AAAA-MM) é obrigatória." });
        }

        if (req.passo) req.passo('📝', 'Validação Salário: OK');
        next();
    }
};