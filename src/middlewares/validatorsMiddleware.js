module.exports = {
    // 1. Validação de USUÁRIO
    validateUser: (req, res, next) => {
        const { nome, email, senha } = req.body;
        
        // Se for a rota de LOGIN, a gente ignora a validação de nome
        if (req.path === '/login') return next();

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

        if (valor === undefined || valor < 0) {
            if (req.passo) req.passo('⚠️', 'Validação Salário falhou: Valor inválido');
            return res.status(400).json({ error: "O valor deve ser positivo." });
        }

        if (!referencia_mes) {
            if (req.passo) req.passo('⚠️', 'Validação Salário falhou: Sem mês');
            return res.status(400).json({ error: "A referência do mês (AAAA-MM) é obrigatória." });
        }

        if (req.passo) req.passo('📝', 'Validação Salário: OK');
        next();
    },

    // 3. Validação de CATEGORIA (Não esqueça dessa!)
    validateCategoria: (req, res, next) => {
        const { nome } = req.body;

        if (!nome) {
            if (req.passo) req.passo('⚠️', 'Validação Categoria: Sem nome');
            return res.status(400).json({ error: "O nome da categoria é obrigatório." });
        }

        if (req.passo) req.passo('📝', 'Validação Categoria: OK');
        next();
    },

    // 4. Validação de GASTOS FIXOS (A que você queria adicionar)
    validateGastoFixo: (req, res, next) => {
        const { nome, valor, categoria_id, dia_vencimento } = req.body;

        if (!nome || !valor || !categoria_id || !dia_vencimento) {
            if (req.passo) req.passo('⚠️', 'Validação Gasto Fixo: Dados incompletos');
            return res.status(400).json({ error: "Campos obrigatórios: nome, valor, categoria_id, dia_vencimento." });
        }

        // Valida se o dia é lógico (1 a 31)
        if (dia_vencimento < 1 || dia_vencimento > 31) {
            return res.status(400).json({ error: "O dia do vencimento deve ser entre 1 e 31." });
        }

        if (req.passo) req.passo('📝', 'Validação Gasto Fixo: OK');
        next();
    }

}; 